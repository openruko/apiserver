module.exports = {
  getCollaborators: {
    routePath: '/apps/:appName/collaborators',
    payloadSource: 'params',
    method: 'GET',
    after: 'onlyRows',
    okayCode: 200,
    errorCode: 404
  },
  addCollaborator: {
    routePath : '/apps/:appName/collaborators',
    payloadSource: 'query',
    method: 'POST',
    okayCode: 200,
    before: function(cb) {
      var payload = this.requestPayload;
      payload.email = payload.collaborator.email;
      cb();
    },
    after: function(cb) {
      this.responsePayload = this.requestPayload.collaborator.email + " added as a collaborator on " + this.requestPayload.appName;
      cb();
    },
    errorCode: 422
  },
  removeCollaborator: {
    routePath : '/apps/:appName/collaborators/:email',
    payloadSource: 'params',
    method: 'DELETE',
    okayCode: 200,
    after: function(cb) {
      this.responsePayload = this.responsePayload.rows[0].email + " has been removed as collaborator on " + this.requestPayload.appName;
      cb();
    },
    errorCode: 404
  }
};
