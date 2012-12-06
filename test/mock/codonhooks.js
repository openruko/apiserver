var request = require('request');
var common = require('../common');
var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';

exports.preReceive = function(appName, cb){
  request.post({
    url: base + '/internal/' + appName + '/pushcode',
    body: ["---",
           "config_vars:",
           "  PATH: bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin",
           "pstable:",
           "  web: node server.js",
           "commit: 78b214d29a4072f6d60cc91120d04eddd00e27b8",
           "slug_id: 1354484080.74201"
    ].join("\n")
  }, cb);
};
