var request = require('request');
var common = require('../common');

var base = 'https://:' + common.superUser.apiKey + '@localhost:5000';

exports.updateState = function(appId, dynoId, dynoHostname, instanceId, state, cb){
  request.post({
    url: base + '/internal/updatestate',
    json: {
      appId: appId,
      dynoId: dynoId,
      dynoHostname: dynoHostname,
      instanceId: instanceId,
      state: state
    }
  }, cb);
};

exports.incrementHeartbeat = function(instanceId, cb){
  request.post({
    url: base + '/internal/incrementHeartbeat',
    json: {
      instanceId: instanceId
    }
  }, function(err, resp, body){
    cb(err, body);
  });
};

exports.getJobs = function(cb){
  request({
    url: base + '/internal/getjobs',
    json: true
  }, function(err, resp, body){
    cb(err, body);
  });
};
