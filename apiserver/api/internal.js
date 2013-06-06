var uuid = require('node-uuid');
var s3url = require('./../s3url');
var hstore = require('node-postgres-hstore');
var db = require('../apidb');
var dbfacade= require('../dbfacade')(db);
var async = require('async');
var yaml = require('js-yaml');
var conf = require('../conf');

module.exports = {
  lookupUserByPublicKey: {
    payloadSource: 'query',
    method: 'GET',
    errorCode: 404,
    routePath: '/internal/lookupUserByPublicKey',
    after: function(cb) {
      this.responsePayload = this.responsePayload.rows[0].id.toString() + ':' +
          this.responsePayload.rows[0].api_key.toString();
      cb();
    }
  },
  pushRelease:{
    routePath: '/internal/:appName/pushcode',
    payloadSource: 'raw',
    method: 'POST',
    before: function(cb) {

      var yamlBody = this.requestPayload.body;
      var payload = yaml.load(yamlBody);

      this.requestPayload.addons = payload.addons;
      this.requestPayload.envVars = payload.config_vars || {};
      this.requestPayload.pstable = payload.pstable;
      this.requestPayload.commit = payload.commit;
      this.requestPayload.slugId = payload.slug_id.toString();

      cb();
    },
    after: function(cb) {
      this.responsePayload = (this.responsePayload.rows[0].seq_count).toString();
      cb();
    }
  },
  handleGitCommand: {
    routePath: '/internal/:appName/gitaction',
    payloadSource: 'query',
    method: 'POST',
    okayCode: 200,
    before: function(cb) {
      this.requestPayload.command = '/usr/bin/' + this.requestPayload.command;
      cb();
    },
    after: function(cb) {
      var timesQueried = 0;
      var jobId = this.responsePayload.rows[0].id;
      var result;
      var self = this;

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
        cb();
      });
    }
  },
  updateState: {
    routePath: '/internal/updatestate',
    payloadSource: 'body',
    method: 'POST',
    okayCode: 200
  },

  addUser: {
    routePath: '/internal/user',
    payloadSource: 'body',
    method: 'POST',
    okayCode: 200,
    errorCode: 422,
    before: function(cb){
      this.requestPayload = this.raw.req.body;
      cb();
    },
    after: function(cb){
      var dbResponse = this.responsePayload.rows[0];
      this.responsePayload = "Congrat " + dbResponse.name + ". Welcome on Openruko ;)"
      cb();
    }
  },

  // TODO is it used ?
  getAppMetadata: {
    routePath : '/internal/:appName/metadata',
    payloadSource: 'query',
    alternativePgFunction: 'getCurrentRelease',
    method: 'GET',
    okayCode: 200,
    errorCode: 404,
    after: function(cb) {

      var dbResponse = this.responsePayload.rows[0];
      var realResponse = this.responsePayload = {};


      var repoSigner = s3url.createSigner(conf.s3.reposBucket);
      var slugSigner = s3url.createSigner(conf.s3.slugsBucket);

      realResponse.slug_put_url = slugSigner(dbResponse.app_id + uuid.v4() + '.tgz');
      realResponse.repo_put_url = repoSigner(dbResponse.app_id + '.tgz');
      realResponse.repo_get_url = repoSigner(dbResponse.app_id + '.tgz');

      realResponse.env = hstore.parse(dbResponse.env);
      realResponse.addons = dbResponse.addons;


      cb();
    }
  },

  // Increment an app's heartbeat by 1
  incrementHeartbeat: {
    routePath : '/internal/incrementHeartbeat',
    payloadSource: 'body',
    method: 'POST',
    okayCode: 200,
    errorCode: 404
  },

  addAddon: {
    routePath: '/internal/addon',
    payloadSource: 'body',
    method: 'POST',
    okayCode: 200,
    errorCode: 422,
    before: function(cb){
      this.requestPayload = this.raw.req.body;
      cb();
    },
    after: function(cb){
      var dbResponse = this.responsePayload.rows[0];
      this.responsePayload = "Addon " + dbResponse.name + ", registered with success. ;)"
      cb();
    }
  }

};
