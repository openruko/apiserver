var express = require('./customexpress');
var apiglue = require('./apiglue');
var fs = require('fs');
var path = require('path');

module.exports.createServer = function(opts) {

  var app = express.createServer();

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
  app.start = function() {
    app.db.init(function(err) {
      if(err) {
        console.log(err);
        process.exit(1);
      } else {
        require('./jobgiver')(app);
        app.listen(opts.port);
        console.log('Listening on http port ' + opts.port);
      }
    });
  };

  app.stop = function() {
    app.close();
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
  var apiLetsPath = path.join(__dirname, 'api');
  var files = fs.readdirSync(apiLetsPath);
  var requireFiles = files.map(function(file) {
    return file.substring(0, file.length - 3);
  });
  return requireFiles;
}
