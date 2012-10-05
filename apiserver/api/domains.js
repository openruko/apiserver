module.exports = {
  getDomains: {
    routePath: '/apps/:appName/domains',
    method: 'get',
    okayCode: 200,
    after: 'onlyRows'
  },
  deleteDomain: {
    routePath: '/apps/:appName/domains/:domainName',
    method: 'delete',
    okayCode: 200
  },
  deleteDomains: {
    routePath: '/apps/:appName/domains',
    method: 'delete',
    okayCode: 200
  },
  addDomain: {
    routePath: '/apps/:appName/domains',
    payloadSource: 'query',
    method: 'post',
    okayCode: 201,
    after: function(cb) {
      this.responsePayload = {
        domain: this.requestPayload.domainName
      };
      cb();
    },
    before: function(cb) {
      this.requestPayload.domainName = this.requestPayload.domain_name.domain;
      cb();

    }
  }
};
