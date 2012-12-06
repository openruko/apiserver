var hstore = require('node-postgres-hstore');

module.exports = {
  getReleases: {
    routePath: '/apps/:appName/releases',
    okayCode: 200,
    after: function(cb) {
      this.responsePayload = this.responsePayload.rows.map(function(row) {
        row.addons = [];
        row.env = hstore.parse(row.env);
        row.pstable = hstore.parse(row.pstable);
        row.user = row.user_email;
        return row;
      });
      cb();
    },
    method: 'get'
  },
  getCurrentRelease: {
    routePath : '/apps/:appName/releases/current',
    payloadSource: 'body',
    method: 'GET',
    okayCode: 200,
    after: function(cb) {
      this.responsePayload = this.responsePayload.rows.map(function(row) {
        row.addons = [];
        row.env = hstore.parse(row.env);
        row.pstable = hstore.parse(row.pstable);
        row.user = row.user_email;
        return row;
      })[0];
      cb();
    },
    errorCode: 404
  },
  getRelease: {
    routePath: '/apps/:appName/releases/:releaseId',
    errorCode: 404,
    okayCode: 200,
    method: 'get',
    after: function(cb) {
      this.responsePayload = this.responsePayload.rows.map(function(row) {
        row.addons = [];
        row.env = hstore.parse(row.env);
        row.pstable = hstore.parse(row.pstable);
        row.user = row.user_email;
        return row;
      })[0];
      cb();
    }
  },
  rollbackRelease: {
    routePath: '/apps/:appName/releases',
    payloadSource: 'query',
    before: function(cb) {
      this.requestPayload.releaseId = this.requestPayload.rollback || 'last';
      cb();
    },
    after: function(cb) {
      // TODO replace is a pretty bad hack
      this.responsePayload = this.responsePayload.rows[0].descr.replace(/Rollback to /, '');
      cb();
    },
    okayCode: 200,
    errorCode: 404,
    method: 'post'
  }
};
