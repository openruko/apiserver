var pg = require('pg');

var pgConfig = {
  'database' : process.env['PGDATABASE'] || 'openruko',
  'host' : process.env['PGHOST'] || 'localhost',
  'user' : process.env['PGUSER'] || 'openruko',
  'password' :  process.env['PGPASSWORD']
};

var pgClient = new pg.Client(pgConfig);
pgClient.connect();
module.exports = pgClient;
