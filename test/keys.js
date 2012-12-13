var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');

before(common.startServer);

describe('keys API', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);
  beforeEach(common.addApp);

  var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';
  var sshKey = common.defaultKey.sshKey;

  it('should return empty when listing keys', function(done){
    request({
      url: base + '/user/keys'
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(200);
      expect(body).to.be.empty;
      done();
    });
  });

  it('should fail when deleting a non existing key', function(done){
    request.del({
      url: base + '/user/keys/me@hostname',
      json: true
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(404);
      done();
    });
  });

  describe('with one key', function(){
    beforeEach(function(done){
      request.post({
        url: base + '/user/keys',
        body: sshKey,
        json: false
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('should silently swallow when adding the same key', function(done){
      request.post({
        url: base + '/user/keys',
        body: sshKey,
        json: false
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('should return one key when listing keys', function(done){
      request({
        url: base + '/user/keys'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.length(1);
        expect(body[0].contents).to.be.equal(sshKey);
        expect(body[0].email).to.be.equal('test@test.com');
        done();
      });
    });

    describe('when deleting the key', function(){
      beforeEach(function(done){
        request.del({
          url: base + '/user/keys/me@hostname',
          json: true
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          done();
        });
      });

      it('should return empty when listing keys', function(done){
        request({
          url: base + '/user/keys'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.be.empty;
          done();
        });
      });
    });

    describe('with two keys', function(){
      var sshKey2 = 'ssh-rsa bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb me@hostname';

      beforeEach(function(done){
        request.post({
          url: base + '/user/keys',
          body: sshKey2,
          json: false
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          done();
        });
      });

      it('should return two keys when listing keys', function(done){
        request({
          url: base + '/user/keys'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.length(2);
          done();
        });
      });

      describe('when deleting every keys', function(){
        beforeEach(function(done){
          request.del({
            url: base + '/user/keys',
            json: true
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            done();
          });
        });

        it('should return empty when listing keys', function(done){
          request({
            url: base + '/user/keys'
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.be.empty;
            done();
          });
        });
      });
    });
  });
});
