var request = require('request');
var conf = require('../conf');
var logplexBaseUrl = 'http://' + conf.logplex.hostname + ':' + conf.logplex.udpPort + '/';

module.exports = { 
  loggingSession: { 
    payloadSource : 'query',
    alternativePgFunction: 'getLogplexMap',
    method: 'GET',
    routePath: '/apps/:appName/logs',
    after: function(cb) {
      var map = this.responsePayload.rows;

      var self = this;
      var payload = {
        tokens: map
      };

      var logplexUrl = logplexBaseUrl + 'sessions';

      var appName = this.requestPayload.appName;
      console.log("Setting up log session for app " + appName);
      request({
        method: 'POST',
        json: true,
        url: logplexUrl,
        body: payload
      }, function(err, result) {
        if(err) {
          cb({ error: 'unable to connect to log server', friendly: true})
          return;
        }
        var url = logplexBaseUrl + 'sessions/' + result.body.id;
        self.responsePayload = url;
        cb();
      });

    }
  }
};

