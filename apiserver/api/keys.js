var keyutils = require('./../keyutils')
module.exports = {
  addKey: {
    payloadSource: 'raw',
    routePath: '/user/keys',
    method: 'POST',
    emptySuccessResult: true,
    before: function(cb) {
      var rawKey = this.requestPayload.body.trim();
      var keyParts = rawKey.split(' ');
      var payload = this.requestPayload;
      payload.keyType = keyParts[0];
      payload.keyKey = keyParts[1];
      payload.keyNote = keyParts[2] || '';
      payload.keyFingerprint = keyutils.fingerprintKey(payload.keyKey);
      cb();
    }
  },
  getKeys: {
    description: 'keys',
    payloadSource: 'query',
    routePath: '/user/keys',
    after: function(cb) {
      var self = this;
      self.responsePayload = (self.responsePayload.rows || []).map(function(row) {
        return {
          contents: row.key_type + ' ' + row.key_key + ' ' + row.key_note,
          email: self.requestPayload.userEmail
        }
      });
      cb();
    },
    method: 'GET'
  },
  removeKey: {
    description: 'keys:remove keyNeedle',
    routePath: '/user/keys/:keyNeedle', 
    method: 'DELETE',
    emptySuccessResult: true,
    errorCode: 404
  },
  removeAllKeys: {
    description: 'keys:clear',
    alternativePgFunction: 'removeKey',
    params: {
      keyNeedle: ''
    },
    after: function(cb) {
      this.responsePayload = {};
      cb();
    },
    error: function(cb) {
      this.error = false; // recover
      this.responsePayload = {};
      cb();
    },
    routePath: '/user/keys',
    method: 'DELETE',
    emptySuccessResult: true,
    errorCode: 404
  }
};

