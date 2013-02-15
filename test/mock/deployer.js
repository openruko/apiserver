var request = require('request');
var common = require('../common');

var base = 'https://:' + common.superUser.apiKey + '@localhost:5000';
exports.handleGitCommand = function(appName, cb){
  request({
    method: 'PUT',
    url: base + '/apps/' + appName + '/deploy',
    qs: {
      "app[github_url]": "git@github.com:slotbox/nodejs-hello-world.git"
    }
  }, cb);
};

exports.lookupUserByPublicKey = function(fingerprint, cb){
  request({
    url: base + '/internal/lookupUserByPublicKey?fingerprint=' + fingerprint
  }, cb);
};
