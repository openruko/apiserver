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
    okayCode: 200
  },
  restartInstances: {
    routePath: '/apps/:appName/ps/restart',
    // optional type=
    method: 'POST',
    okayCode: 200
  },
  scaleInstances: {
    routePath: '/apps/:appName/ps/scale',
    payloadSource: 'query',
    // type= qty=
    method: 'POST',
    okayCode: 200
  }
};
