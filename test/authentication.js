var chai = require('chai')
chai.use(require('chai-http'));
var expect = chai.expect;
var _ = require('underscore');
var request = require('request');
var common = require('./common');


describe('Authentication', function(){
  beforeEach(common.startServer);
  beforeEach(common.cleanDB);

  describe('without user', function(){
  });

  describe('with a user', function(){
    var apiKey;
    beforeEach(function(done){
      common.addUser(function(err, user){
        done(err);
        console.log(user);
        expect(user).to.be.an('object');
        expect(user).to.include.keys('api_key');
      });
    });

    describe('and authenticated', function(){
      var base = 'http://:' + apiKey + '@localhost:5000';

      it('should be authorized to access /apps', function(done){
        request({
          url: base + '/apps',
          json: true
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
        });
      })
    })
  });

});
