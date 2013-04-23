var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var Assertion = chai.Assertion;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');
var nock = require('nock');

// https://github.com/azukiapp/apiserver/wiki/Addons
Assertion.addProperty('addon', function () {
  var body = this._obj;
  expect(body.name).to.be.equal('fakeaddon:test');
  expect(body.description).to.be.equal('Test plan');
  expect(body.url).to.be.equal('http://fakeaddon.provider.com/heroku/resources');
  expect(body.beta).to.be.null;
  expect(body.state).to.be.equal('beta');
  expect(body.attachable).to.be.null;
  expect(body.price.cents).to.be.equal(0);
  expect(body.price.unit).to.be.equal('month');
  expect(body.slug).to.be.null;
  expect(body.terms_of_service).to.be.null;
  expect(body.consume_dyno_hour).to.be.null;
  expect(body.plan_description).to.be.null;
  expect(body.group_description).to.be.equal('fakeaddon');
  expect(body.selective).to.be.null;
});


var defaultFakeBody = {id: 'fakeaddon', config: {'TEST_URL': 'mysql:fakeurl'}};
var mockProviderRequest = function(fakeBody){
  var providerAuth = "Basic " + new Buffer("fakeaddon:pass").toString("base64");
  var providerScope = nock('http://fakeaddon.provider.com')
    .matchHeader('Authorization', providerAuth)
    .post('/heroku/resources')
    .reply(201, fakeBody);
}

before(common.startServer);

describe('Addons API', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);

  var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';

  describe('list without registered addons', function(){
    it('list addons should return nothing', function(done){
      request({
        url: base + '/addons'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.be.empty;
        done();
      });
    })
  });

  describe('list with registered addons', function(){
    beforeEach(common.addAddon);
    it('should return one addon when listing addons', function(done){
      request({
        url: base + '/addons'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.length(1);
        expect(body[0]).to.be.an.addon;
        done();
      });
    })
  });

  describe('add without registered addons', function(){
    beforeEach(common.addApp);
    it('should return not found', function(done){
      request({
        url: base + '/apps/myApp/addons/fakeaddon',
        method: 'POST'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(404);
        expect(body.error).to.be.equal('Addon not found.');
        done();
      });
    })
  });

  describe('add with registered addons', function(){
    beforeEach(common.addAddon);
    beforeEach(common.addApp);
    it('should validate if plan is informed', function(done){
      request({
        url: base + '/apps/myApp/addons/fakeaddon',
        method: 'POST'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(404);
        expect(body.error).to.be.equal('Addon plan not found.');
        done();
      });
    })

    it('should validate if url provider is unavailable', function(done){
      request({
        url: base + '/apps/myApp/addons/fakeaddon:test',
        method: 'POST'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(404);
        expect(body.error).to.be.equal('unable to request resource from provider server');
        done();
      });
    })

    it('should validate provider config vars', function(done){
      var fakeBody = {id: 'fakeaddon', config: {'INVALID_CONFIG_VAR': 'mysql:fakeurl'}};
      mockProviderRequest(fakeBody);

      request({
        url: base + '/apps/myApp/addons/fakeaddon:test',
        method: 'POST'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(422);
        expect(body.error).to.be.equal('invalid resource from provider server');
        done();
      });
    })

    it('should be successful', function(done){
      mockProviderRequest(defaultFakeBody);

      request({
        url: base + '/apps/myApp/addons/fakeaddon:test',
        method: 'POST'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body.status).to.be.equal('Installed');
        expect(body.message).to.be.equal('Welcome! Thanks for using fakeaddon');
        expect(body.price).to.be.equal('free');
        done();
      });
    })

    it('should validate if app already contain addon', function(done){
      mockProviderRequest(defaultFakeBody);
      request({
        url: base + '/apps/myApp/addons/fakeaddon:test',
        method: 'POST'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);

        request({
          url: base + '/apps/myApp/addons/fakeaddon:test',
          method: 'POST'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(422);
          expect(body.error).to.be.equal('app already contain fakeaddon addon.');
          done();
        });
      });
    })

  });

});
