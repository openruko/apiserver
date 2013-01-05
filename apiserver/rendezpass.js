var uuid = require('node-uuid');
var tls = require('tls');
var fs = require('fs')
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
      secureClient.on('data', function(data) {
        console.log(data.toString());
        console.log(data.toString());
        s.write(data);
      });
      s.on('data', function(data) {
        console.log(data.toString());
        secureClient.write(data);
      });
    });

  });
});

server.listen(conf.apiserver.rendezvous.port);
