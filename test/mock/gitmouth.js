var request = require('request');
var common = require('../common');

var base = 'https://:' + common.superUser.apiKey + '@localhost:5000';
exports.handleGitCommand = function(appName, cb){
  request.post({
    url: base + '/internal/' + appName + '/gitaction?command=git-receive-pack'
  }, cb);
};

exports.lookupUserByPublicKey = function(fingerprint, cb){
  request({
    url: base + '/internal/lookupUserByPublicKey?fingerprint=' + fingerprint
  }, cb);
};
