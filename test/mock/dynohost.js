var request = require('request');
var common = require('../common');

var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';

exports.updateState = function(appId, dynoId, instanceId, state, cb){
  request.post({
    url: base + '/internal/updatestate',
    json: {
      appId: appId,
      dynoId: dynoId,
      instanceId: instanceId,
      state: state
    }
  }, cb);
};

exports.getJobs = function(cb){
  request({
    url: base + '/internal/getjobs',
    json: true
  }, function(err, resp, body){
    cb(err, body);
  });
};
