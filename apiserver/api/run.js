var hstore = require('node-postgres-hstore');
var db = require('../apidb');
var dbfacade= require('../dbfacade')(db);
var async = require('async');
var conf = require('../conf');

module.exports = {
  runCommand: {
    routePath: '/apps/:appName/ps',
    payloadSource: 'query',
    method: 'POST',
    okayCode: 200,
    after: function(cb) {

      var timesQueried = 0;
      var jobId = this.responsePayload.rows[0].id;
      var result;
      var self = this;

      // Query the Job Giver 15 times with the job ID created via the run_command PGSQL function.
      async.whilst(function() {
        return !(result || timesQueried > 15);
      }, function(callback) {
        dbfacade.exec('getJob', { jobId: jobId }, function(err, dbResult) {
          timesQueried++;
          if(err) return callback(err);

          // Return a socket URI that connects to the dyno that has picked up the job.
          var job = dbResult.rows[0];
          if(job.distributed_to) {
            result  = {
              slug: "000000_00000",
              command: self.requestPayload.command,
              upid: job.dyno_id,
              process: 'run.1',
              action: 'complete',
              rendezvous_url: 'tcp://' + conf.apiserver.hostname + ':' + conf.apiserver.rendezvous.port + '/' + job.rez_id,
              type: 'Ps',
              elapsed: 0,
              attached: true,
              transitioned_at: new Date(),
              state: 'starting'
            };
            var rezMap = require('../rendezpass');
            rezMap.addMapping(job.rez_id, job.distributed_to, job.dyno_id);

          }
          if(result) {
            callback();
          } else {
            setTimeout(callback, 200);
          }
        });
      }, function(err) {
        if(err || !result) {
          return cb({ error: 'job not picked up within time limit - dyno servers down?', friendly: true });
        }
        self.responsePayload = result;
        cb();
      });
    }
  }
};
