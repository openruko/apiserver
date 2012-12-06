var request = require('request');
var common = require('../common');

exports.handleGitCommand = function(appName, cb){
  var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';
  request.post({
    url: base + '/internal/' + appName + '/gitaction?command=git-receive-pack'
  }, cb);
};

exports.lookupUserByPublicKey = function(fingerprint){
  var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';
  request.post({
    url: base + '/internal/lookupUserByPublicKey?fingerprint=' + fingerprint
  }, cb);
};
