var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');

before(common.startServer);

describe('collaborators API', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);
  beforeEach(common.addApp);
  beforeEach(function(done){
    common.addUser({
      email: 'friend@friend.com',
      name: 'friend',
      password: 'friend',
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    }, done);
  });

  var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';

  it('should only return me when listing collaborators', function(done){
    request({
      url: base + '/apps/myApp/collaborators'
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(200);
      expect(body).to.have.length(1);
      expect(body[0].access).to.be.equal('edit');
      expect(body[0].email).to.be.equal('test@test.com');
      done();
    });
  });

  it('should fail when deleting a non existing collaborator', function(done){
    request.del({
      url: base + '/apps/myApp/collaborators/friend@friend.com',
      json: false
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(404);
      done();
    });
  });

  describe('with one collaborator', function(){
    beforeEach(function(done){
      request.post({
        url: base + '/apps/myApp/collaborators',
        qs: {
          'collaborator[email]': 'friend@friend.com'
        },
        json: false
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.be.equal('friend@friend.com added as a collaborator on myApp');
        done();
      });
    });

    it('should return me and the collaborator when listing collaborators', function(done){
      request({
        url: base + '/apps/myApp/collaborators'
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.have.length(2);
        expect(body[0].email).to.be.equal('test@test.com');
        expect(body[0].access).to.be.equal('edit');
        expect(body[1].email).to.be.equal('friend@friend.com');
        expect(body[1].access).to.be.equal('edit');
        done();
      });
    });

    describe('when deleting the collaborator', function(){
      beforeEach(function(done){
        request.del({
          url: base + '/apps/myApp/collaborators/friend@friend.com',
          json: false
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.be.equal('friend@friend.com has been removed as collaborator on myApp');
          done();
        });
      });

      it('should only return me when listing collaborators', function(done){
        request({
          url: base + '/apps/myApp/collaborators'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.length(1);
          done();
        });
      });
    });
  });
});
