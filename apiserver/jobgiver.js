var db = require('./apidb');
var dbfacade= require('./dbfacade')(db);
var _ = require('underscore');
var async = require('async');
var hstore = require('node-postgres-hstore');
var slugSigner = require('./s3url');

tasks = {};

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
    ], cb);
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


var signer = slugSigner.createSigner(process.env.S3_BUCKET);

var s3regex = new RegExp("^s3([a-z]*)://([a-zA-Z0-9-]*)(/([a-zA-Z0-9.-_]*))+$",'i');

var processMount = function(mountUrl) {

  mountUrl = mountUrl.replace('{{S3_BUCKET}}', process.env.S3_BUCKET);
  mountUrl = mountUrl.replace('{{BASE_PROTOCOL}}', process.env.BASE_PROTOCOL);
  mountUrl = mountUrl.replace('{{BASE_HOST}}', process.env.BASE_HOST);
  
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

    result.rows.filter(function(row) {
      return row.next_action === 'start';
    }).forEach(function(row) {

      row.env_vars = hstore.parse(row.env_vars ) || {};
      row.mounts = hstore.parse(row.mounts) || {};

      //sign slug urls
      Object.keys(row.mounts).forEach(function(mountKey) {
        row.mounts[mountKey] = processMount(row.mounts[mountKey]);
      });
      Object.keys(row.env_vars).forEach(function(mountKey) {
        row.env_vars[mountKey] = processMount(row.env_vars[mountKey]);
      });

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
