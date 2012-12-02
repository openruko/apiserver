var env = process.env;

['S3_KEY', 'S3_SECRET', 'S3_BUCKET'].forEach(function(envKey) {
  if(!env[envKey]) {
    throw new Error('Environment variables ' + envKey + ' must be defined.');
  }
});

module.exports = {
  s3: {
    key: env.S3_KEY,
    secret: env.S3_SECRET,
    bucket: env.S3_BUCKET,
    hostname: env.S3_HOSTNAME || null, // if null will be set by amazon-s3-url-signer
    port: env.S3_PORT || null // if null will be set by amazon-s3-url-signer
    // Is it used ?
    //reposBucket: env.S3_REPOS_BUCKET || 'openruko_repos',
    //slugsBucket: env.S3_SLUGS_BUCKET || 'openruko_slugs'
  },
  apiserver: {
    protocol: env.APISERVER_PROTOCOL || 'http',
    hostname: env.APISERVER_HOST || 'localhost',
    port: env.APISERVER_PORT || 5000
  },
  pg: {
    database: env.PG_DATABASE || 'openruko',
    hostname: env.PG_HOST || 'localhost',
    user: env.PG_USER || 'openruko',
    password: env.PG_PASSWORD || 'openruko',
    schema: env.PG_SCHEMA || 'openruko_api'
  },
  logplex: {
    hostname: env.LOGPLEX_HOST || 'localhost',
    webPort: env.LOGPLEX_WEB_PORT || 9996,
    udpPort: env.LOGPLEX_UDP_PORT || 9999
  },
}
