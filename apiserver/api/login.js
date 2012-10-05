module.exports = { 
  authenticateUser: { 
    payloadSource : 'query',
    method: 'POST',
    errorCode: 401,
    routePath: '/login', 
    authenticate: false,
    after: 'singleRow'
  }
};

