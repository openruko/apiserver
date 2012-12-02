module.exports = {
  addApp: {
    routePath : '/apps',
    payloadSource: 'query',
    method: 'POST',
    okayCode: 202,
    before: function(cb) {
      var payload = this.requestPayload;
      payload.name = payload.app.name;
      payload.stack = payload.app.stack;
      cb();
    },
    after: 'singleRow',
    errorCode: 422
  },
  destroyApp: {
    routePath : '/apps/:appName',
    payloadSource: 'query',
    method: 'DELETE',
    appOwnerOnly: true,
    okayCode: 200,
    after: function(cb) {
      this.responsePayload = {};
      cb();
    },
    errorCode: 404
  },
  getApps: {
    routePath: '/apps',
    payloadSource: 'params',
    method: 'GET',
    okayCode: 200,
    after: 'onlyRows'
  },
  getApp: {
    routePath: '/apps/:appName',
    payloadSource: 'params',
    method: 'GET',
    okayCode: 200,
    after: 'singleRow',
    errorCode: 404
  },
  getAddons: {
    routePath: '/apps/:appName/addons',
    payloadSource: 'params',
    method: 'GET',
    after: 'onlyRows',
    okayCode: 200,
    errorCode: 404
  },
  // FIXME why this here, and in domains.js
  getDomains: {
    routePath: '/apps/:appName/domains',
    payloadSource: 'params',
    method: 'GET',
    after: 'onlyRows',
    okayCode: 200,
    errorCode: 404
  }
  // TODO rename an app
  // TODO transfer an app
  // TODO toggle maintenance mode
};
