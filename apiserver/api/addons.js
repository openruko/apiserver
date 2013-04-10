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
  getAddons: {
    routePath: '/apps/:appName/addons',
    payloadSource: 'params',
    method: 'GET',
    after: 'onlyRows',
    okayCode: 200,
    errorCode: 404
  }
};
