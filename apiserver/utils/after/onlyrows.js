module.exports = function(cb) {
  this.responsePayload = (this.responsePayload.rows || []);
  cb();
}

