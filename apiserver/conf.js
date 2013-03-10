var env = process.env;

['S3_KEY', 'S3_SECRET', 'S3_BUCKET', 'APISERVER_KEY'].forEach(function(envKey) {
  if(!env[envKey]) {
    throw new Error('Environment variables ' + envKey + ' must be defined.');
  }
});

module.exports = {
  openruko: {
    // All key/values here are placed into the settings table of the DB
    //base_domain: "openruko.com"
  },
  s3: {
    key: env.S3_KEY,
    secret: env.S3_SECRET,
    bucket: env.S3_BUCKET,
    hostname: env.S3_HOSTNAME || null, // if null will be set to amazon s3 default
    port: env.S3_PORT || null // if null will be set to amazon s3 default
  },
  dynohost: {
    rendezvous: {
      port: env.DYNOHOST_RENDEZVOUS_PORT || 4000
    }
  },
  apiserver: {
    protocol: env.APISERVER_PROTOCOL || 'https',
    hostname: env.APISERVER_HOST || 'localhost',
    port: env.APISERVER_PORT || 5000,
    key: env.APISERVER_KEY,
    rendezvous: {
      port: env.APISERVER_RENDEZVOUS_PORT || 4321
    }
  },
  pg: {
    database: env.PG_DATABASE || 'openruko',
    hostname: env.PG_HOST || 'localhost',
    user: env.PG_USER || env.USER,
    password: env.PG_PASSWORD
  },
  logplex: {
    hostname: env.LOGPLEX_HOST || 'localhost',
    webPort: env.LOGPLEX_WEB_PORT || 9996,
    udpPort: env.LOGPLEX_UDP_PORT || 9999
  }
};
