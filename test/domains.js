var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');

before(common.startServer);

describe('domains API', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);
  beforeEach(common.addApp);

  var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';

  it('should return empty when listing domains', function(done){
    request({
      url: base + '/apps/myApp/domains'
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(200);
      expect(body).to.be.empty;
      done();
    });
  });

  it('should fail when deleting a non existing domain', function(done){
    request.del({
      url: base + '/apps/myApp/domains/sub.domain.com',
      json: true
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(404);
      done();
    });
  });

  describe('with one domain', function(){
    beforeEach(function(done){
      request.post({
        url: base + '/apps/myApp/domains',
        qs: {
          'domain_name[domain]': 'sub.domain.com'
        }
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(201);
        expect(body.domain).to.be.equal('sub.domain.com');
        done();
      });
    });

    it('should fail when adding the same domain', function(done){
      request.post({
        url: base + '/apps/myApp/domains',
        qs: {
          'domain_name[domain]': 'sub.domain.com'
        }
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(422);
        done();
      });
    });

    it('should return one domain when listing domains', function(done){
      request({
        url: base + '/apps/myApp/domains'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.length(1);
        expect(body[0].domain).to.be.equal('sub.domain.com');
        expect(body[0].base_domain).to.be.equal('domain.com');
        done();
      });
    });

    describe('when deleting the domain', function(){
      beforeEach(function(done){
        request.del({
          url: base + '/apps/myApp/domains/sub.domain.com',
          json: true
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          done();
        });
      });

      it('should return empty when listing domains', function(done){
        request({
          url: base + '/apps/myApp/domains'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.be.empty;
          done();
        });
      });
    });

    describe('with two domains', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/domains',
          qs: {
            'domain_name[domain]': 'sub.domain2.com'
          }
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(201);
          done();
        });
      });

      it('should return two domains when listing domains', function(done){
        request({
          url: base + '/apps/myApp/domains'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.length(2);
          done();
        });
      });

      describe('when deleting every domains', function(){
        beforeEach(function(done){
          request.del({
            url: base + '/apps/myApp/domains',
            json: true
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            done();
          });
        });

        it('should return empty when listing domains', function(done){
          request({
            url: base + '/apps/myApp/domains'
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
