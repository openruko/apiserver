var express = require('./customexpress');
var apiglue = require('./apiglue');
var fs = require('fs');
var Path = require('path');

module.exports.createServer = function(opts) {
  var tls = {
    key: fs.readFileSync(Path.join(__dirname, '../certs/server-key.pem')),
    cert: fs.readFileSync(Path.join(__dirname, '../certs/server-cert.pem'))
  };

  var app = express.createServer(tls);

  app.configure(function() {
    app.use(express.bodyParser());
    app.use(app.router);
  });

  app.debug = function(msg) {
    console.log(msg);
  };

  var pgInstance = require('./apidb');
  app.db = require('./dbfacade')(pgInstance);

  var apiLets = getApiLets();
  apiLets.forEach(function(apiLetName) {

    var apiLetManifest = require('./api/' + apiLetName);
    Object.keys(apiLetManifest).forEach(function(key) {
      var routeInfo = apiLetManifest[key];
      apiglue.buildHandler(app, routeInfo, key);
    });
  });

  //yuck
  app.start = function(cb) {
    app.db.init(function(err) {
      if(err) {
        console.log(new Error().stack);
        // throw err;
      } else {
        require('./jobgiver')(app);
        app.listen(opts.port, cb);
        console.log('Listening on http port ' + opts.port);
      }
    });
  };

  app.stop = function(cb) {
    app.close(cb);
    pgInstance.end();
  };

  app.error(function(err,req,res,next) {
    console.log('routing error');
    console.dir(err);
    console.dir(err.stack);
  });

  return app;
};

module.exports.getApiLets = getApiLets;

function getApiLets() {
  var apiLetsPath = Path.join(__dirname, 'api');
  var files = fs.readdirSync(apiLetsPath);
  var requireFiles = files.map(function(file) {
    return file.substring(0, file.length - 3);
  });
  return requireFiles;
}
