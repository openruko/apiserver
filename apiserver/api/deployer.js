module.exports = {
  destroyApp: {
    routePath : '/apps/:appName/deploy',
    payloadSource: 'query',
    method: 'PUT',
    okayCode: 200,
    handler: function(cb) {
      var payload = this.requestPayload;
      this.responsePayload = {"appName": payload.appName, "github_url": payload.app.github_url};
      cb();
    },
    errorCode: 404
  }
};