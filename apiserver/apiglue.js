var async = require('async');
var _ = require('underscore');

module.exports.buildHandler = function(app, routeInfo, key) {
  
  var chain = [];

  if(routeInfo.authenticate !== false) {
    chain.push(authenticateRequest);
  }

  if(/internal/.test(routeInfo.routePath)) {
    chain.push(authorizeRequest);
  }

  if(/:appName/.test(routeInfo.routePath)) {
    chain.push(authorizeRequest);
  }

  chain.push(buildRequestPayload);

  if(typeof routeInfo.before === 'function') {
    chain.push(routeInfo.before);
  } 

  if(typeof routeInfo.before === 'string') {
    var modulePath ='./utils/before/' + routeInfo.before.toLowerCase();
    chain.push(require(modulePath));
  }

  if(routeInfo.handler) {
    chain.push(routeInfo.handler);
  } else {
    chain.push(callPostgresFunction);
  }

  if(typeof routeInfo.after === 'function') {
    chain.push(routeInfo.after);
  } 

  if(typeof routeInfo.after === 'string') {
    chain.push(require('./utils/after/' + routeInfo.after.toLowerCase()));
  }

  var method = routeInfo.method ? routeInfo.method.toLowerCase() : 'post';
  console.log('Route setup:  [' + method + '] ' + routeInfo.routePath);
  app[method](routeInfo.routePath, function(req, res) {

    console.log(req.connection.remoteAddress + ' [' + method + '] ' + req.url);
    var context = {
      raw: {
        req: req,
        res: res
      },
      routeInfo: routeInfo,
      routeKey: key,
      requestPayload: {},
      responsePayload: {},
      db: app.db
    };

    async.series(chain.map(function(chainFn) {
      return chainFn.bind(context);
    }), function(err) {
      context.error = err;

      var processResult = function() {
        if(context.error && !context.unsafe) {
          outputError.call(context, context.error);
        } else {
          outputResult.call(context);
        }
      };

      if(err && routeInfo.error) {
        routeInfo.error.call(context, processResult);
      } else {
        processResult();
      }

    });
  });
};

authenticateRequest = function(cb) {

  var self = this;
  var auth = self.raw.req.headers.authorization;

  if(!auth || auth.length < 10) {
    return cb({ error: 'Access denied', code: 401, friendly: true });
  }

  var decoded = new Buffer(auth.substring(5),'base64').toString();
  var decodedParts = decoded.split(':');
  var apikey = decodedParts[decodedParts.length - 1];

  self.requestPayload.apiKey = apikey;
  
  self.db.exec('authenticateUserByApiKey', { apiKey: apikey }, 
  function(err, result) {
    if(err) return cb(_.extend(err, {code: 401}));

    var user = result.rows[0];
    self.requestPayload.userId = user.id;
    self.requestPayload.userEmail = user.email;
    self.requestPayload.isSuperUser  = user.is_super_user;
    cb();
  });
};

authorizeRequest = function(cb) {

  var self = this;

  if((self.routeInfo.superUserOnly || /internal/.test(self.routeInfo.routePath)) && !self.requestPayload.isSuperUser) {
    return cb({ error: 'Access denied', code: 401, friendly: true });
  }

  if(/:appName/.test(self.routeInfo.routePath)) {
    var pgArgs = { userId: self.requestPayload.userId,
      appName: self.raw.req.params.appName.toString() };

    self.db.exec('authorizeUserByAppName', pgArgs, function(err, result) {
      if(err) return cb(err);
      self.requestPayload.appId = result.rows[0].app_id; 
      self.requestPayload.appName = pgArgs.appName;
      self.requestPayload.isAppOwner = result.rows[0].is_app_owner; 
      if(self.routeInfo.appOwnerOnly && !self.requestPayload.isAppOwner) {
        return cb({ error: 'Access denied', code: 401, friendly: true });
      } else {
        cb();
      }
    });
  }else{
    cb();
  }
};

buildRequestPayload = function(cb) {
  
  var nonOverrideable = ['userId','appId','apiKey',
    'userEmail','isAppOwner','isSuperUser','appName'];
  
  var self = this;

  var req = self.raw.req;

  // from route path e.g. /app/:appName
  _.extend(self.requestPayload, req.params || {});

  // ensure special properties can't be overriden by qs or json body payload
  var payloadSource = req[self.routeInfo.payloadSource || 'query'];

  Object.keys(payloadSource).forEach(function(key) {
    if(nonOverrideable.indexOf(key) === -1) {
      self.requestPayload[key] = payloadSource[key];
    }
  });

  // route level explicit overrides
  _.extend(self.requestPayload, self.routeInfo.params || {});

  cb();
};

callPostgresFunction = function(cb) {

  var self = this;

  var pgFunction = self.routeInfo.alternativePgFunction || 
    self.routeKey;


  self.db.exec(pgFunction, self.requestPayload, function(dbError, dbResult) {
    if(dbError) return cb(dbError);
    self.responsePayload = dbResult || dbError;
    return cb();
  });

};

outputResult = function() {

  var self = this;

  var response = self.raw.res;

  response.header('Server','openruko');
  response.header('Strict-Transport-Security','max-age=500');
  response.header('Cache-Control','private, max-age=0, must-revalidate');

  var okayCode = self.routeInfo.okayCode || 200;
  if(self.routeInfo.emptySuccessResult) {
    response.send('', okayCode);
  } else {
    response.send(self.responsePayload, okayCode);
  }
};

outputError = function(err) {
  var self = this;
  var response = self.raw.res;
  var req = self.raw.req;

  console.log('ERROR: ' + req.connection.remoteAddress + ' [' + req.method + '] ' + req.url);
  console.dir(err);

  response.header('Server','openruko');
  response.header('Strict-Transport-Security','max-age=500');
  response.header('Cache-Control','private, max-age=0, must-revalidate');

  if(err.code > 600) delete err.code; // do not transmit postgresql error code as http code.
  var errorCode = err.code || self.routeInfo.errorCode || 500;
  if(typeof err === 'object' && err.friendly) {
    response.send({ error: err.error }, errorCode);
  } else {
    response.send({ error: 'Server Error. Check status page.'}, errorCode);
  }

};
