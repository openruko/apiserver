var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var _ = require('underscore');
var request = require('request');
var common = require('./common');

before(common.startServer);

describe('Authentication', function(){
  beforeEach(common.cleanDB);

  describe('without user', function(){
    var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';
    it('should not be authorized to access /apps', function(done){
      request({
        url: base + '/apps',
        json: true
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(401);
        done();
      });
    });
  });

  describe('with user', function(){
    beforeEach(common.addUser);

    describe('without key', function(){
      var base = 'https://localhost:5000';
      it('should not be authorized to access /apps', function(done){
        request({
          url: base + '/apps',
          json: true
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(401);
          done();
        });
      });
    });

    describe('with a wrong key', function(){
      var base = 'https://:blablabla@localhost:5000';
      it('should not be authorized to access /apps', function(done){
        request({
          url: base + '/apps',
          json: true
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(401);
          done();
        });
      });
    });

    describe('with a valid key', function(){
      var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';
      it('should be authorized to access /apps', function(done){
        request({
          url: base + '/apps',
          json: true
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          done();
        });
      });
    });
  });
});
