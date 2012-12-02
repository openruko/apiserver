var request = require('request');
var common = require('../common');

var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';

exports.dynoId1 = 'dynoaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
exports.dynoId2 = 'dynobbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
exports.dynoId3 = 'dynocccc-cccc-cccc-cccc-cccccccccccc';

exports.instanceId1 = 'instance-1111-1111-1111-111111111111';
exports.instanceId2 = 'instance-2222-2222-2222-222222222222';
exports.instanceId3 = 'instance-3333-3333-3333-333333333333';

exports.states= {
  starting: 'starting',
  listening: 'listening',
  running: 'running',
  completed: 'completed',
  errored: 'errored'
};

exports.updateState = function(appId, dynoId, instanceId, state){
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

exports.getjobs = function(){
  request(base + '/internal/getjobs', cb);
};
