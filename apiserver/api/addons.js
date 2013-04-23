var util = require('util');  // useful for DEBUG
var request = require('request');
var db = require('../apidb');
var dbfacade= require('../dbfacade')(db);

module.exports = {
  getAllAddons: {
    routePath: '/addons',
    payloadSource: 'params',
    method: 'GET',
    after: function(cb) {
      var rows = (this.responsePayload.rows || []);
      rows.map(function(row){
        row.price = {cents: row.price_cents,
                     unit: row.price_unit};
        delete row.price_cents;
        delete row.price_unit;
        // Sets Heroku's properties
        row.beta = null;
        row.attachable = null;
        row.slug = null;
        row.terms_of_service = null;
        row.consume_dyno_hour = null;
        row.plan_description = null;
        row.selective = null;
      });
      this.responsePayload = rows;
      cb();
    },
    okayCode: 200
  },
  installAddon: {
    alternativePgFunction: 'installAddonValidation',
    routePath: '/apps/:appName/addons/:addonName',
    payloadSource: 'params',
    method: 'POST',
    after: function(cb) {
      var self = this;
      var addonRow = this.responsePayload.rows[0];
      var configVars = addonRow.config_vars;
      console.log("DEBUG " + util.inspect(addonRow));

      var providerUrl = addonRow.provider_url;
      // TODO: see how to make HTTPS works. This problem is on provider app side.
      providerUrl = providerUrl.replace(/https/, "http");
      console.log("Requesting resource from " + providerUrl);

      // TODO: see how to set timeout "in seconds"
      request({
        method: 'POST',
        json: true,
        url: providerUrl,
        auth: addonRow.addon_id + ":" + addonRow.password
      }, function(err, result) {
        if(err) {
          cb({ error: 'unable to request resource from provider server', friendly: true})
          return;
        }

        // Example of expected response body (from successful request):
        // {id: resource.id, config: {"MYSQL_ADDON_DATABASE_URL": resource.url}}
        var resourceUrl = result.body.config[addonRow.config_vars];

        // TODO: check if result config has keys from addon "manifest"
        //if (typeof(resourceUrl) == "undefined" || resourceUrl == null)
        //  // raise error here!?!
        //}

        installParams = self.requestPayload;
        installParams.envVars = {};
        installParams.envVars[addonRow.config_vars] = resourceUrl;
        console.log("DEBUG " + util.inspect(installParams));

        self.db.exec('installAddon', installParams, function(dbError, dbResult) {
          if(dbError) return cb(dbError);
        });

        self.responsePayload = {
          "status": "Installed",
          "message": "Welcome! Thanks for using " + addonRow.addon_id,
          "price": "free"
        }
        cb();
      });
    },
    okayCode: 200,
    errorCode: 404
  }
};
