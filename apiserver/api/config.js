var hstore = require('node-postgres-hstore');

module.exports = {
  getConfig: {
    routePath: '/apps/:appName/config_vars',
    method: 'GET',
    okayCode: 200,
    after: function(cb) {
      var result = this.responsePayload;
      this.responsePayload = hstore.parse(result.rows[0].env);
      cb();
    }
  },
  removeConfig: {
    routePath: '/apps/:appName/config_vars/:keyToRemove',
    method: 'DELETE',
    okayCode: 200
  },
  addConfig: {
    routePath : '/apps/:appName/config_vars',
    payloadSource: 'body',
    method: 'PUT',
    okayCode: 200,
    before: function(cb) {
      // heroku cli doesnt set content-type grr..
      var envvars = JSON.parse(this.raw.req.raw.body);
      this.requestPayload = {
        envVars: envvars,
        appId: this.requestPayload.appId,
        userId: this.requestPayload.userId
      };
      cb();
    },
    after: function(cb) {
      this.responsePayload = hstore.parse(this.responsePayload.rows[0].env);
      cb();
    },
    errorCode: 422
  }
};
