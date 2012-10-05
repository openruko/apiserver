var as3 = require('amazon-s3-url-signer');

module.exports = {
  createSigner: function(bucket) {

    var slugClient = as3.urlSigner(process.env.S3_KEY, process.env.S3_SECRET );

    return function(method, filename) {
      return slugClient.getUrl(method.toUpperCase(),
                               filename, 
                               bucket,
                              600);
    };
  }
};

