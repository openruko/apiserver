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
    alternativePgFunction: 'getAppAddon',
    routePath: '/apps/:appName/addons/:addonName',
    payloadSource: 'params',
    method: 'POST',
    after: function(cb) {
      var self = this;
      var addonInfo = this.responsePayload.rows[0];

      if (addonInfo.contain_addon) {
        var msg = 'app already contain ' + addonInfo.name + ' addon.';
        return cb({ error: msg, code: 422, friendly: true });
      }

      var providerAuth = "Basic " + new Buffer(addonInfo.name + ':' + addonInfo.password).toString("base64");
      var providerUrl = addonInfo.provider_url;
      console.log("Requesting resource from " + providerUrl);

      request({
        method: 'POST',
        json: true,
        url: providerUrl,
        headers : {
          "Authorization" : providerAuth
        },
        timeout: 1000  //1s
      }, function(err, result) {
        if(err) {
          cb({ error: 'unable to request resource from provider server', friendly: true})
          return;
        }

        // Example of expected response body (from successful request):
        // {id: resource.id, config: {"MYSQL_ADDON_DATABASE_URL": resource.url}}
        var resourceUrl = result.body.config[addonInfo.config_vars];

        if (typeof(resourceUrl) == "undefined" || resourceUrl == null){
          cb({ error: 'invalid resource from provider server', code: 422, friendly: true});
          return;
        }

        var installParams = self.requestPayload;
        installParams.resourceId = result.body.id;
        installParams.resourceVars = {};
        installParams.resourceVars[addonInfo.config_vars] = resourceUrl;

        self.db.exec('installAddon', installParams, function(dbError, dbResult) {
          if(dbError) return cb(dbError);
        });

        self.responsePayload = {
          "status": "Installed",
          "message": "Welcome! Thanks for using " + addonInfo.name,
          "price": "free"
        }
        cb();
      });
    },
    okayCode: 200,
    errorCode: 404
  },
  removeAddon: {
      alternativePgFunction: 'getAppAddon',
      routePath: '/apps/:appName/addons/:addonName',
      payloadSource: 'params',
      method: 'DELETE',
      after: function(cb) {
        var self = this;
        var addonInfo = this.responsePayload.rows[0];

        if (!addonInfo.contain_addon) {
          var msg = 'Addon not found on ' + self.requestPayload.appName;
          return cb({ error: msg, code: 404, friendly: true });
        }

        var providerAuth = "Basic " + new Buffer(addonInfo.name + ':' + addonInfo.password).toString("base64");
        var providerUrl = addonInfo.provider_url;
        providerUrl += "/" + addonInfo.resource_id;

        console.log("Removing resource from " + providerUrl);

        request({
          method: 'DELETE',
          json: true,
          url: providerUrl,
          headers : {
            "Authorization" : providerAuth
          },
          timeout: 1000  //1s
        }, function(err, result) {
          if(err) {
            cb({ error: 'unable to request resource from provider server', friendly: true})
            return;
          }

          self.db.exec('removeAddon', self.requestPayload, function(dbError, dbResult) {
            if(dbError) return cb(dbError);
          });

          self.responsePayload = {
            "status": "Uninstalled",
            "message": null,
            "price": "free"
          }
          cb();
        });
      },
      okayCode: 200,
      errorCode: 404
    }
};
