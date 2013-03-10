var fs = require('fs');
var Path = require('path');
var pg = require('pg');
var hstore = require('node-postgres-hstore');
var dibigrator = require('dibigrator');
var async = require('async');
var fmtutils = require('./fmtutils');
var version = require('../package.json').version;
var conf = require('./conf');
var layouts = { 'bootstrap': ['schemaName'] };

module.exports = function(pgClient, options) {

  options = options || {};

  var self = {};

  self.init = function(cb) {
    async.series([
      function(cb){
        console.log('Load extensions');
        async.forEach(['plpgsql', 'pgcrypto', 'hstore'], function(extension, cb){
          pgClient.query("CREATE EXTENSION IF NOT EXISTS " + extension, cb);
        }, cb);
      },function(cb){
        console.log('create data schema');
        pgClient.query('CREATE SCHEMA openruko_data', function(err){
          if(/already exists/.test(err)) return cb();
          cb(err);
        });
      },function(cb){
        pgClient.query('SET search_path TO openruko_data, public', cb);
      },function(cb){
        var path = Path.join(__dirname, '../postgres/openruko_data/functions');
        fs.readdir(path, function(err, files){
          if(err) return cb(err);
          console.log('load', path);
          async.forEach(files, function(file, cb){
            fs.readFile(Path.join(path, file), function(err, data){
              if(err) return cb(err);
              pgClient.query(data.toString(), cb);
            });
          }, cb);
        });
      },function(cb){
        var migrationPath = Path.join(__dirname, '../postgres/openruko_data/tables');
        console.log('migrate', migrationPath);
        dibigrator.postgresql(pgClient, migrationPath).migrate(version,cb);
      },function(cb){
        console.log('create api schema');
        pgClient.query('DROP SCHEMA IF EXISTS openruko_api CASCADE; CREATE SCHEMA openruko_api', cb);
      },function(cb){
        pgClient.query('SET search_path TO openruko_api, openruko_data, public', cb);
      },function(cb){
        async.forEach([
          'openruko_api/views',
          'openruko_api/functions'
        ], function(path, cb){
          path = Path.join(__dirname, '../postgres', path);
          fs.readdir(path, function(err, files){
            if(err) return cb(err);
            console.log('load', path);
            async.forEach(files, function(file, cb){
              fs.readFile(Path.join(path, file), function(err, data){
                if(err) return cb(err);
                console.log(file);
                pgClient.query(data.toString(), cb);
              });
            }, cb);
          });
        }, cb);
      },function(cb){
        pgClient.query('SET search_path TO openruko_data, openruko_api, public', cb);
      },function(cb){
        pgClient.query("SELECT * FROM add_user('admin@dev.null','superuser', 'nopassword', true, $1)", [conf.apiserver.key], function(err){
          if(/already exists/.test(err)) return cb();
          cb(err);
        });
      },function(cb){
        self.exec('bootstrap', { schemaName: 'openruko_api'}, function(err,result) {
          if(err) return cb(err);
          result.rows.forEach(function(row) {
            row = processBoostrapRow(row);
            layouts[fmtutils.fromPostgres(row.name)] = row.args;
          });
          cb();
        });
      },function(cb){
        // Settings
        // Add openruko settings values from conf.js object
        var key_name;
        for(key_name in conf.openruko){
          // Running UPDATE and then INSERT like this acts as an UPSERT
          async.series([
            function(cb){
              pgClient.query("UPDATE openruko_data.settings SET key=$1, value=$2 WHERE key=$1;",
                [key_name, conf.openruko[key_name]],
                cb
              );
            },
            function(cb){
              pgClient.query(
                "INSERT INTO openruko_data.settings (key, value) \
                  SELECT $1, $2 \
                  WHERE NOT EXISTS (SELECT 1 FROM openruko_data.settings WHERE key=$1);",
                [key_name, conf.openruko[key_name]],
                cb
              );
            }
          ]);
        }
        cb();
      }
    ], cb);
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

    layout=layout.filter(function(column){return payload[column] !== undefined })

    sql += '(' + layout.map(function(item, index)  {
      return "$" + (index + 1);
    }).join(',') + ')';

    var values = [];

    layout.forEach(function(column) {
      var payloadValue = payload[column];
      if(payloadValue && typeof payloadValue === 'object') {
        payloadValue = hstore.stringify(payloadValue);
      }
      if(payloadValue !== undefined){
        values.push(payloadValue);
      }
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

