var request = require('request');
var querystring = require('querystring');
var conf = require('../conf');
var logplexBaseUrl = 'http://' + conf.logplex.hostname + ':' + conf.logplex.webPort + '/';

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

        var options = self.requestPayload;
        var qs = querystring.stringify({
          tail: options.tail,
          num: options.num,
          ps: options.ps,
          source: options.source
        });
        self.responsePayload = url + '?' + qs;
        cb();
      });

    }
  }
};

