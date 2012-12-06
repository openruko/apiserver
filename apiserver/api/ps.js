var hstore = require('node-postgres-hstore');

module.exports = {
  getInstances: {
    routePath: '/apps/:appName/ps',
    method: 'GET',
    okayCode: 200,
    after: 'onlyRows'
  },
  stopInstances: {
    routePath: '/apps/:appName/ps/stop',
    // required type=
    payloadSource: 'query',
    method: 'POST',
    okayCode: 200,
    alternativePgFunction: 'scaleInstances',
    before: function(cb) {
      var payload = this.requestPayload;
      payload.qty = 0;
      cb();
    },
    after: function(cb){
      this.responsePayload = "ok";
      cb();
    }
  },
  restartInstances: {
    routePath: '/apps/:appName/ps/restart',
    // optional type=
    method: 'POST',
    okayCode: 200,
    after: function(cb){
      this.responsePayload = "ok";
      cb();
    }
  },
  scaleInstances: {
    routePath: '/apps/:appName/ps/scale',
    payloadSource: 'query',
    // type= qty=
    method: 'POST',
    okayCode: 200,
    errorCode: 404,
    after: function(cb){
      /* Not very useful for information, but this is the behaviour of Heroku */
      this.responsePayload = ""+this.requestPayload.qty;
      cb();
    }
  }
};
