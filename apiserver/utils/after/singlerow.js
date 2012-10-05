module.exports = function(cb) {
  this.responsePayload = this.responsePayload.rows[0];
  cb();
}
