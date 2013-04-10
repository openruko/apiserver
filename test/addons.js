var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var Assertion = chai.Assertion;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');

// https://github.com/azukiapp/apiserver/wiki/Addons
Assertion.addProperty('addon', function () {
  var body = this._obj;
  expect(body.name).to.be.equal('fakeaddon:test');
  expect(body.description).to.be.equal('Test plan');
  expect(body.url).to.be.equal('http://testprovider.com');
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

before(common.startServer);

describe('addons API', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);

  var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';

  describe('without addons', function(){
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

  describe('with addons', function(){
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

});
