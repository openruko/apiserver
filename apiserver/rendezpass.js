/**
  * THE RENDEVOUS SERVER
  *
  * The Rendezvous server acts as a middle-man between clients that want to talk to dynos
  * and dyno sockets. The classic examples are the API's /apps/:appName//run methods that attach
  * to a dyno and run arbitrary commands. Firstly the Heroku CLi client speaks to the API to get
  * connection details including the dyno_id, it then opens up a TCP socket to this Rendezvous
  * server. This server then connects input and output streams as if there was a direct
  * connection.
 **/

var uuid = require('node-uuid');
var tls = require('tls');
var fs = require('fs');
var conf = require('./conf');

var rendezMap = {};
module.exports.addMapping = function(rezid, dyno_hostname, dyno_id) {
 rendezMap[rezid] = {
   hostname: dyno_hostname,
   dyno_id: dyno_id
  };
};

var options = {
  key: fs.readFileSync('certs/server-key.pem'),
  cert: fs.readFileSync('certs/server-cert.pem')
};

var server = tls.createServer(options, function(s) {

  s.setNoDelay();
  s.once('data', function(data) {
    var strData = data.toString();
    var dataParts = strData.toString().split('\n');
    var rez_id = dataParts[0];

    var payload = rendezMap[rez_id];

    s.write('\n');

    // TODO localhost should be replaced by the right hostname
    var secureClient = tls.connect({ host: 'localhost', port: conf.dynohost.rendezvous.port }, function() {
      secureClient.write('xyz\n' + payload.dyno_id + '\n');

      // Pass on data from dyno to Rendevous user
      secureClient.on('data', function(data) {
        s.write(data);
      });

      // Pass on data from Rendevous user to dyno
      s.on('data', function(data) {
        if(!secureClient.writable) return;
        secureClient.write(data);
      });

      // Close connection to Rendevous user when dyno socket closes
      secureClient.on('close', function() {
        s.destroySoon();
      });

      // Close connection to dyno socket when Rendevous user socket closes
      s.on('close', function() {
        secureClient.destroySoon();
      });

    });

  });
});

server.listen(conf.apiserver.rendezvous.port);
