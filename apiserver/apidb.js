var pg = require('pg');
var conf = require('./conf');

var pgClient = new pg.Client(conf.pg);
pgClient.connect();
module.exports = pgClient;
