var chai = require('chai-stack');
chai.use(require('chai-http'));
var expect = chai.expect;
var Assertion = chai.Assertion;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');

Assertion.addProperty('initialRelease', function () {
  var body = this._obj;
  expect(body.name).to.be.equal('v1');
  expect(body.user).to.be.equal('test@test.com');
  expect(body.descr).to.be.equal('Initial release');
  expect(body.pstable).to.be.empty;
  expect(body.commit).to.be.null;
  expect(body.addons).to.be.empty;
  expect(body.env).to.be.empty;
  expect(body.created_at).to.be.not.null;
});

before(common.startServer);

describe('releases API', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);
  beforeEach(common.addApp);

  var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';

  it('should return releases list', function(done){
    request({
      url: base + '/apps/myApp/releases'
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(200);
      expect(body).to.have.length(2);
      expect(body[0]).to.be.initialRelease;
      done();
    });
  });

  it('should return release details', function(done){
    request({
      url: base + '/apps/myApp/releases/v1'
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(200);
      expect(body).to.be.initialRelease;
      done();
    });
  });

  var releases = ['v1', null /* last release */].forEach(function(release){

    describe('when rollback ' + (release || 'last') + ' release', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/releases',
          qs: {
            rollback: release
          },
          json: false
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.be.equal("v1");
          done();
        });
      });

      it('listing releases should return the new release', function(done){
        request({
          url: base + '/apps/myApp/releases'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.length(3);
          expect(body[2].name).to.be.equal('v3');
          expect(body[2].descr).to.be.equal('Rollback to v1');
          done();
        });
      });

      it('current release should return the new release', function(done){
        request({
          url: base + '/apps/myApp/releases/current'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body.name).to.be.equal('v3');
          done();
        });
      });
    });
  });

  it('should fail when rollback a non existing release', function(done){
    request.post({
      url: base + '/apps/myApp/releases',
      qs: {
        rollback: 'v123456'
      },
      json: false
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(404);
      done();
    });
  });
});
