var db = require('../apidb');
var dbfacade= require('../dbfacade')(db);
var async = require('async');

module.exports = {

  deployApp: {
    routePath : '/apps/:appName/deploy',
    payloadSource: 'query',
    method: 'PUT',
    okayCode: 200,

    // Presence of 'handler' overrides attempt to call DB function with same name as route key
    handler: function(cb) {
      var self = this;

      // This isn't needed as we're doing `git pull` now
      this.requestPayload.command = '/app/hooks/fetch-repo ' + this.requestPayload.app.github_url;
      // this.requestPayload.commandArgs = ["pull", this.requestPayload.app.github_url];

      console.log(this.requestPayload);

      // var appName = requestPayload.appName;
      // var githubUrl = requestPayload.app.github_url;

      // Get a job to build the new slug
      dbfacade.exec('handleGitCommand', this.requestPayload, function(dbError, dbResult) {
        if(dbError) return cb(dbError);

        var timesQueried = 0;
        var jobId = dbResult.rows[0].id;
        var result;

        // Get connection details to the build dyno
        async.whilst(function() {
          return !(result || timesQueried > 15);
        }, function(callback) {
          dbfacade.exec('getJob', { jobId: jobId }, function(err, dbResult) {
            timesQueried++;
            if(err) return callback(err);

            var job = dbResult.rows[0];
            console.log(job);
            if(job.distributed_to) {
              result  = {
                slug: "000000_00000",
                command: self.requestPayload.command,
                upid: job.dyno_id,
                process: 'dyno.' + job.dyno_id,
                action: 'complete',
                rendezvous_url: 'tcp://slotbox.local:4321/' + job.rez_id,
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
              setTimeout(callback, 500);
            }
          });
        }, function(err) {
          if(err || !result) {
            console.log('Unable to assign job');
            return cb({ error: 'job not assigned' });
          }
          self.responsePayload = result;

          // Connect to the dyno, but how!?

          cb();
        });
      });

    }
  }
};