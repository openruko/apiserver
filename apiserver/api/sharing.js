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
      this.responsePayload = "Added as collaborator";
      cb();
    },
    errorCode: 422
  },
  removeCollaborator: {
    routePath : '/apps/:appName/collaborators/:email',
    payloadSource: 'params',
    method: 'DELETE',
    okayCode: 200,
    after: 'singleRow',
    errorCode: 422
  }
};
