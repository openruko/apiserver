var crypto = require('crypto');

module.exports = {
  fingerprintKey: function(key) {
    var hasher = crypto.createHash('md5');
    hasher.update(new Buffer(key,'base64').toString('binary'));
    return hasher.digest('hex');
  }
};

