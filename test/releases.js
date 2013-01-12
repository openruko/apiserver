var chai = require('chai-stack');
chai.use(require('chai-http'));
var expect = chai.expect;
var Assertion = chai.Assertion;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');
var preReceiveMock = require('./mock/codonhooks').preReceive;

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

  var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';

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

  describe('When pre-receive hook push a new release', function(){
    beforeEach(function(done){
      preReceiveMock('myApp', done);
    });

    it('listing releases should return the new release', function(done){
      request({
        url: base + '/apps/myApp/releases'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.length(3);
        expect(body[2].name).to.be.equal('v3');
        expect(body[2].descr).to.be.equal('Deploy 78b214');
        expect(body[2].commit).to.be.equal('78b214d29a4072f6d60cc91120d04eddd00e27b8');
        expect(body[2].env).to.be.deep.equal({ PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin' });
        expect(body[2].pstable).to.be.deep.equal({ web: 'node server.js' });
        expect(body[2].slug_id).to.be.equal('1354484080.74201');
        done();
      });
    });

    describe('when adding config', function(){
      beforeEach(function(done){
        common.addConfig(function(err, res, body){
          if(err) return done(err);
          body = JSON.parse(body);
          expect(res).to.have.status(200);
          expect(body).to.have.keys(['PATH', 'KEY1', 'KEY2']);
          done();
        });
      });

      it('should merge env variable', function(done){
        request({
          url: base + '/apps/myApp/releases'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.length(4);
          expect(body[3].descr).to.be.equal('Add KEY1, KEY2');
          expect(body[3].env).to.be.deep.equal({
            PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin',
            KEY1: 'VALUE1',
            KEY2: 'VALUE2'
          });
          done();
        });
      });
    });
  });
});
