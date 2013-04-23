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

exports.superUser = {
  email: 'super@super.com',
  name: 'super',
  password: 'super',
  apiKey: 'ssssssssssssssssssssssssssssssssssssssss',
  isSuperUser: true
};

exports.defaultKey = {
  sshKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDKwNiuklprOgtXBOyS10l40bGdztXQg9nKT5a+bwEmbyuXMOSa49c5YzXgGcEdhtQ2CbJ9GK9URywPD3SX0JgFQ588tT5E75ZhbSXgRQLipwDZF5g4RaKuZwpJ3ifb9TVl/M0gh8oVFCyZdLj4NHbLg1qG46oeKqKmBBuNPjxC2Ki9yiA3aFe1mKNxivDWf/c44cvYRC/D4/Ckn7Iql1xSpMXHvPzRRYjKElHhZlHuBRp1aezb+WxN11zHg9b+xsN5t7EjShVyGmld5LpwG7ZCqTUvy8LbFCKEELpr1/5atASb4d3vNYZ77lLb9Mx0GozJ5nYlAdLqXbhMvT6bTAyj me@hostname',
  fingerprint: '6cbcf7c2b4703cd2b49b2c49878c403e'
};

exports.defaultAddonManifest = {
  addonId: 'fakeaddon',
  configVars: 'TEST_URL',
  password: 'pass',
  ssoSalt: 'sso salt',
  url: 'http://fakeaddon.provider.com/heroku/resources',
  ssoUrl: 'http://testprovider.com/ssourl'
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
  exports.addSuperUser(exports.superUser, function(err){
    if(err) return cb(err);
    var base = 'https://:' + exports.superUser.apiKey + '@localhost:5000';
    user = _(user).defaults(exports.defaultUser);
    request.post({
      url: base + '/internal/user',
      json: user
    }, cb);
  });
};

exports.addSuperUser = function(user, cb){
  if(typeof user === 'function'){
    cb = user;
    user = {};
  }
  app.db.exec('addUser', _(user).defaults(exports.superUser), function(err, results){
    if(err && /Sorry, a user with that email address already exists/.test(err.error)) return cb();
    if(err) return cb(err);
    cb(null, results.rows[0]);
  });
};

exports.cleanDB = function(cb){
  app.db.exec('clean', null, cb);
};

var base = 'https://:' + exports.defaultUser.apiKey + '@localhost:5000';
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

exports.getUserByApiKey = function(apiKey, cb) {
  app.db.exec('authenticateUserByApiKey', {apiKey: apiKey }, function(err, results){
    if(err) return cb(err);
    cb(null, results.rows[0]);
  });
};

exports.addAddon = function(cb){
  // Note: this is the only way that i found to get user id. :X
  exports.getUserByApiKey(exports.defaultUser.apiKey,
  function(err, user){
    var addonManifest = exports.defaultAddonManifest;
    addonManifest.userId = user.id;

    app.db.exec('addProviderAddon', addonManifest, function(err, results){
      if(err) return cb(err);
      cb(null, results.rows[0]);
    });
  });
};
