var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');

before(common.startServer);

describe('config API', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);
  beforeEach(common.addApp);

  var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';

  it('should return empty when listing config', function(done){
    request({
      url: base + '/apps/myApp/config_vars'
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(200);
      expect(body).to.be.empty;
      done();
    });
  });

  describe('with two keys', function(){
    beforeEach(function(done){
      common.addConfig(function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        body = JSON.parse(body);
        expect(body).to.have.keys(['KEY1', 'KEY2']);
        done();
      });
    });

    it('should create a new release', function(done){
      request({
        url: base + '/apps/myApp/releases'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.length(3);
        expect(body[2].env).to.be.deep.equal({ KEY1: 'VALUE1', KEY2: 'VALUE2' });
        done();
      });
    });

    it('should return the two keys when listing config', function(done){
      request({
        url: base + '/apps/myApp/config_vars'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.keys(['KEY1', 'KEY2']);
        done();
      });
    });

    describe('when deleting one key', function(){
      beforeEach(function(done){
        request.del({
          url: base + '/apps/myApp/config_vars/KEY1'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.keys(['KEY2']);
          done();
        });
      });

      it('should create a new release', function(done){
        request({
          url: base + '/apps/myApp/releases'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.length(4);
          done();
        });
      });
    });
  });

});
