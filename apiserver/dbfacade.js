var pg = require('pg');
var fmtutils = require('./fmtutils');
var hstore = require('node-postgres-hstore');
var layouts = { 'bootstrap': ['schemaName'] };

module.exports = function(pgClient, options) {

  options = options || {};

  var self = {};

  self.init = function(cb) {

    pgClient.query('SET search_path TO openruko_data, openruko_api, public', function(err) {
      if(err) return cb(err);

      self.exec('bootstrap', { schemaName: 'openruko_api'}, function(err,result) {
        if(err) return cb(err);
        result.rows.forEach(function(row) {
          row = processBoostrapRow(row);
          layouts[fmtutils.fromPostgres(row.name)] = row.args;
        });
        cb();
      });
    });
  };

  self.exec = function(pgFunctionName, payload, cb) {

    var layout = layouts[pgFunctionName];

    if(!layout) {
      return cb({ unsafe: true,
                  error: 'no matched api function on backend for ' +
        pgFunctionName });
    }

    var sql = "SELECT * FROM openruko_api." + 
      fmtutils.toPostgres(pgFunctionName) + " ";

    sql += '(' + layout.map(function(item, index)  {
      return "$" + (index + 1);
    }).join(',') + ')';

    var values = [];

    layout.forEach(function(column) {
      var payloadValue = payload[column];
      if(payloadValue && typeof payloadValue === 'object') {
        payloadValue = hstore.stringify(payloadValue);
      }
      values.push(payloadValue);
    });

    pgClient.query(sql, values, function(err, result) {
      if(err) { 
        if(typeof err === 'object' && err.code === 'P0001') {
          return cb({ error:  err.toString().substring(7) , friendly: true });
        } else {
          return cb(err);
        }
      }
      cb(null,result);
    });
  };
  return self;

};

module.exports.processBootstrapRow = processBoostrapRow;

function processBoostrapRow(row) {

  var argstring = row.fn_args;

  var args = [];
  if(argstring && argstring.length > 2) {
    argstring = argstring.substr(1, argstring.length - 2);
    argstring.split(',').map(fmtutils.fromPostgres).forEach(function(arg) {
      args.push(arg);
    });
  }

  return {
    name: row.fn_name,
    args: args
  };
}

