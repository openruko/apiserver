var as3 = require('amazon-s3-url-signer');
var conf = require('./conf');

module.exports = {
  createSigner: function(bucket) {

    var slugClient = as3.urlSigner(conf.s3.key, conf.s3.secret, {
      host: conf.s3.hostname,
      port: conf.s3.port
    });

    return function(method, filename) {
      return slugClient.getUrl(method.toUpperCase(),
                               filename, 
                               bucket,
                              600);
    };
  }
};

