module.exports = { 
  getUser: { 
    payloadSource : 'query',
    method: 'GET',
    routePath: '/user',
    after: 'singleRow' 
  },
  oneTimeKey: {
    method: 'POST',
    routePath: '/user/onetime',
    after: 'singleRow'
  }
};


