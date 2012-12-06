var server = require('../apiserver/apiserver');
var _ = require('underscore');
var request = require('request').defaults({json: true});

exports.defaultUser = {
  email: 'test@test.com',
  name: 'test',
  password: 'test',
  apiKey: '28790f7a7e2a33a7d12b0d5206cbc36020a36649',
  isSuperUser: false
};

var app;
exports.startServer = function(cb){
  if(app) return cb();
  app = server.createServer({
    port: 5000,
    s3key: 123,
    s3secret: 123
  });
  app.start(cb);
};

exports.addUser = function(user, cb){
  if(typeof user === 'function'){
    cb = user;
    user = {};
  }
  app.db.exec('addUser', _(user).defaults(exports.defaultUser), function(err, results){
    if(err) return cb(err);
    cb(null, results.rows[0]);
  });
};

exports.cleanDB = function(cb){
  app.db.exec('clean', null, cb);
};

var base = 'http://:' + exports.defaultUser.apiKey + '@localhost:5000';
exports.addApp = function(cb){
  request.post({
    url: base + '/apps',
    qs: {
      'app[name]' : 'myApp',
      'app[stack]': null
    }
  }, cb);
};

exports.addConfig = function(cb){
  request.put({
    url: base + '/apps/myApp/config_vars',
    body: JSON.stringify({
      KEY1: 'VALUE1',
      KEY2: 'VALUE2'
    }),
    json: false
  }, cb);
};
