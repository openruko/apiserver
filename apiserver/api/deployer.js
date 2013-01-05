var db = require('../apidb');
var dbfacade= require('../dbfacade')(db);
var async = require('async');

module.exports = {

  destroyApp: {
    routePath : '/apps/:appName/deploy',
    payloadSource: 'query',
    method: 'PUT',
    okayCode: 200,

    // Presence of 'handler' overrides attempt to call DB function with same name as route key
    handler: function(cb) {
      var self = this;

      // This isn't needed as we're doing `git pull` now
      this.requestPayload.command = '/usr/bin/git-recieve-pack';

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
          return (!result) && timesQueried < 20;
        }, function(callback) {
          dbfacade.exec('getJob', { jobId: jobId }, function(err, dbResult) {
            timesQueried++;
            if(err) return callback(err);

            var job = dbResult.rows[0];
            if(job.distributed_to) {
              result = {
                host: job.distributed_to,
                dyno_id: job.dyno_id,
                rez_id: job.rez_id
              };
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