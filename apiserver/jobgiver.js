/*
 * The basic idea of how jobs work in Openruko is that jobs are first created by adding a job
 * to the provision_job table. Take for example the very simple `openruko run ls'; this triggers
 * the run_command.pgsql function, which in turns creates a job that waits to be picked up by a dyno.
 * The dyno hostserver (only one runs inside each dyno server; NB. many dynos can run inside a 
 * dyno server) polls for jobs via the /internal/getjobs route below. If a dyno succesfully picks up
 * a job then it is marked as 'distributed' via the distributed_to field in the provision_job table.
 */

var db = require('./apidb');
var dbfacade= require('./dbfacade')(db);
var _ = require('underscore');
var async = require('async');
var hstore = require('node-postgres-hstore');
var slugSigner = require('./s3url');
var _ = require('underscore');
var conf = require('./conf');

var tasks = {};

module.exports =  function(app, options) {


  var jobsOutstanding = {
    provision: [],
    kill: []
  };

  var awaitingAssignment = [];
  var assignedHosts = [];

  var ctx = { 
    jobsOutstanding: jobsOutstanding,
    awaitingAssignment: awaitingAssignment,
    assignedHosts: assignedHosts,
    reset: function() {
      this.jobsOutstanding = {
        provision: [],
        kill: []
      };
      this.awaitingAssignment = [];
    }
  };

  var handleJobDispersion = function(ignore1, cb) {
    async.series([
      tasks.populateJobsOutstanding.bind(ctx),
      tasks.distributeTasksOutstanding.bind(ctx),
      tasks.markJobsDistributed.bind(ctx),
      tasks.waitPeriod.bind(ctx)
    ], function(err){
      if(err) console.error(err);
      cb(err);
    });

  };

  var processQueue = async.queue(handleJobDispersion, 1);

  function wakeUp() {
    if(processQueue.length() === 0) {
      processQueue.push({});
    }
  }

  app.get('/internal/getjobs', function(req,res, next) {
    awaitingAssignment.push({
      raw: {
        req: req,
        res: res
      },
      runningDynos: 0,
      tasks: [],
      host: req.connection.remoteAddress
    });
    wakeUp();
  });

};


var signer = slugSigner.createSigner(conf.s3.bucket);

var s3regex = new RegExp("^s3([a-z]*)://([a-zA-Z0-9-]*)(/([a-zA-Z0-9.-_]*))+$",'i');

var processMount = function(mountUrl) {

  mountUrl = mountUrl.replace('{{S3_BUCKET}}', conf.s3.bucket);
  mountUrl = mountUrl.replace('{{BASE_PROTOCOL}}', conf.apiserver.protocol);
  mountUrl = mountUrl.replace('{{BASE_HOST}}', conf.apiserver.hostname + ':' + conf.apiserver.port);
  
  var s3match = mountUrl.match(s3regex);

  if(s3match) {
    var method = s3match[1];
    return signer(method.toUpperCase(), '/' + s3match[3]);
  } else {
    return mountUrl;
  }
};

tasks.populateJobsOutstanding = function(callback) {

  var self = this;
  self.jobsOutstanding.provision = [];
  self.jobsOutstanding.kill = [];
  dbfacade.exec('getJobsOutstanding', {}, function(err, result) {
    if(err) return callback(err);

    result.rows.forEach(function(row){
      row.env_vars = hstore.parse(row.env_vars ) || {};
      row.mounts = hstore.parse(row.mounts) || {};

      //sign slug urls
      _(row.mounts).forEach(function(mountValue, mountKey){
        if(!mountValue) return
        row.mounts[mountKey] = processMount(mountValue);
      });

      _(row.env_vars).forEach(function(mountValue, mountKey){
        if(!mountValue) return
        row.env_vars[mountKey] = processMount(mountValue);
      });
    });

    result.rows.filter(function(row) {
      return row.next_action === 'start';
    }).forEach(function(row) {
      self.jobsOutstanding.provision.push(row);
    });

    result.rows.filter(function(row) {
      return row.next_action === 'kill';
    }).forEach(function(row) {
      self.jobsOutstanding.kill.push(row);
    });
    callback();
  });
};

tasks.distributeTasksOutstanding = function(cb) {

  var self = this;
  self.assignedHosts = [];

  // distribute provision job to the least burden dyno hosts
  self.jobsOutstanding.provision.forEach(function(task) {
    var leastBurdenedHost = _.min(self.awaitingAssignment,function(host) {
      return host.runningDynos;
    });


    if(leastBurdenedHost) {

      // Although markJobsDistributed adds the same hostname value to the distributed_to field (which
      // then gets persisted), it doesn't do so until after the job object is returned to the API client.
      // Returning the requesting dyno's hostname to itself (a little tautological I know, but saves the dyno
      // doing awkward system lookups of its external interfaces) allows it to update its record in the
      // instance table with its hostname, which is then used by the HTTP router to forward external web
      // requests.
      task.dyno_hostname = leastBurdenedHost.host;

      leastBurdenedHost.tasks.push(task);
      leastBurdenedHost.runningDynos++;
      self.jobsOutstanding.provision.splice(self.jobsOutstanding.provision.indexOf(task), 1);
      console.log('Assigned provision job');
    }
  });

  // distribute kill job only to dyno on which they were originally provisioned
  self.jobsOutstanding.kill.forEach(function(task) {
    var matchedHost = self.awaitingAssignment.filter(function(ahost) {
      return ahost.host === task.distributed_to;
    })[0];
    if(matchedHost) {
      matchedHost.tasks.push(task);
      matchedHost.runningDynos--;
      console.log('Assigned kill job');
      self.jobsOutstanding.kill.splice(self.jobsOutstanding.kill.indexOf(task), 1);
    }
  });

  self.awaitingAssignment.forEach(function(awHost) {
    awHost.raw.res.send(awHost.tasks);
    self.awaitingAssignment.splice(self.awaitingAssignment.indexOf(awHost),1);
    self.assignedHosts.push(awHost);
  });
  cb();

};

tasks.markJobsDistributed = function(cb) {

  var self = this;
  var jobsDistributed = _.flatten(self.assignedHosts.map(function(awHost) {
    return awHost.tasks.map(function(task) {
      return { host: awHost.host, id: task.id };
    });
  }));
    
  if(jobsDistributed.length) {
    async.series(jobsDistributed.map(function(job) {
      return function(cbx) {
        var data = { host: job.host, id: job.id };
        console.log('Mark Job as Distributed', data);
        dbfacade.exec('markJobDistributed', data,
                    function(err, result) {
                      if(err) return cbx(err);
                      cbx();
                    });
      };
    }), cb);
  } else {
    cb();
  }
};

tasks.waitPeriod = function(cb) {
  //give dyno nodes 250ms to check back in for jobs
  var self = this;
  setTimeout(function() { 
    self.assignedHosts = [];
    cb(); 
  }, 200);
};

module.exports.tasks = tasks;
