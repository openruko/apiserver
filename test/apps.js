var chai = require('chai-stack');
chai.use(require('chai-http'));
var expect = chai.expect;
var Assertion = chai.Assertion
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');

Assertion.addProperty('app', function () {
  var body = this._obj;
  expect(body.id).to.exist;
  expect(body.web_url).to.be.equal('http://myApp.mymachine.me/');
  expect(body.git_url).to.be.equal('git@mymachine.me:myApp.git');
  expect(body.create_status).to.be.equal('created');
  expect(body.dynos).to.be.equal(0);
  expect(body.workers).to.be.equal(0);
});

before(common.startServer);

describe('Apps', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);

  var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';

  describe('without apps', function(){
    it('list apps should return nothing', function(done){
      request({
        url: base + '/apps'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.be.empty;
        done();
      });
    });
  });

  describe('with one app', function(){
    beforeEach(function(done){
      common.addApp(function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(202);
        expect(body).to.be.an.app;
        done();
      });
    });

    it('should return one app when listing apps', function(done){
      request({
        url: base + '/apps'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.length(1);
        expect(body[0].name).to.be.equal('myApp');
        done();
      });
    });

    it('should create a new release', function(done){
      request({
        url: base + '/apps/myApp/releases'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.length(1);
        done();
      });
    });

    it('should return app details', function(done){
      request({
        url: base + '/apps/myApp'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body.name).to.be.equal('myApp');
        expect(body).to.be.an.app;
        done();
      });
    });

    it('should fail when creating an app with the same name', function(done){
      common.addApp(function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(422);
        expect(body.error).to.be.equal('Name is aleady taken.');
        done();
      });
    });

    describe('when deleting the app', function(){
      beforeEach(function(done){
        request.del({
          url: base + '/apps/myApp'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          done();
        });
      });

      it('list apps should return nothing', function(done){
        request({
          url: base + '/apps'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.be.empty;
          done();
        });
      });

      it('should fail when deleting the app twice', function(done){
        request.del({
          url: base + '/apps/myApp'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(404);
          done();
        });
      });
    });

    describe('with one app shared by a friend', function(){
      beforeEach(function(done){
        common.addUser({
          email: 'friend@friend.com',
          name: 'friend',
          password: 'friend',
          apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        }, done);
      });
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/collaborators',
          qs: {
            'collaborator[email]': 'friend@friend.com'
          }
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          done();
        });
      });

      it('should return one app when listing apps as friendd', function(done){
        var base = 'http://:' + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' + '@localhost:5000';
        request({
          url: base + '/apps'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.length(1);
          expect(body[0].name).to.be.equal('myApp');
          expect(body[0].owner_email).to.be.equal('test@test.com');
          done();
        });
      });
    });
  });
});
