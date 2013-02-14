var request = require('request');
var common = require('../common');
var base = 'https://:' + common.superUser.apiKey + '@localhost:5000';

exports.preReceive = function(appName, pstable, cb){
  if(typeof pstable === 'function'){
    cb = pstable;
    pstable = null;
  }
  pstable = pstable || [
    "pstable:",
    "  web: node server.js"
  ].join('\n');

  request.post({
    url: base + '/internal/' + appName + '/pushcode',
    body: ["---",
           "config_vars:",
           "  PATH: bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin",
           pstable,
           "commit: 78b214d29a4072f6d60cc91120d04eddd00e27b8",
           "slug_id: 1354484080.74201"
    ].join("\n")
  }, cb);
};
