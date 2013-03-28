var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');
var preReceiveMock = require('./mock/codonhooks').preReceive;
var dynohostMock = require('./mock/dynohost');

before(common.startServer);

describe('ps API', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);
  beforeEach(common.addSuperUser);
  beforeEach(common.addApp);

  var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';

  it('should return empty when listing processes', function(done){
    request({
      url: base + '/apps/myApp/ps'
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(200);
      expect(body).to.be.empty;
      done();
    });
  });

  describe('without a commit', function(){
    it('should silently swallow when restarting an app', function(done){
      request.post({
        url: base + '/apps/myApp/ps/restart',
        json: false
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.be.equal('ok');
        done();
      });
    });

    it('should fails when scaling an app', function(done){
      request.post({
        url: base + '/apps/myApp/ps/scale',
        qs: {
          type: 'web',
          qty: 2
        }
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(404);
        expect(body.error).to.be.equal('No such type as web');
        done();
      });
    });

    it('should silently swallow when stopping an app', function(done){
      request.post({
        url: base + '/apps/myApp/ps/stop',
        qs: {
          type: 'web'
        },
        json: false
      }, function(err, res, body){
        if(err) return done(err);
        expect(res).to.have.status(200);
        expect(body).to.be.equal('ok');
        done();
      });
    });
  });

  describe('with a commit', function(){
    beforeEach(function(done){
      preReceiveMock('myApp', done);
    });

    describe('with one instance started', function(){
      var instanceId;

      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/scale',
          qs: {
            type: 'web',
            qty: 1
          },
          json: false
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.be.equal('1');
          done();
        });
      });

      describe('when updating the repo', function(){
        beforeEach(function(done){
          // I need to have the instance_id of the first dyno in order to kill it
          dynohostMock.getJobs(function(err, data){
            preReceiveMock('myApp', function(err){
              dynohostMock.updateState('myApp', data[0].dyno_id, data[0].dyno_hostname, data[0].instance_id, 'completed', done);
            });
          });
        });

        it('should return one instance when listing processes', function(done){
          request({
            url: base + '/apps/myApp/ps'
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.have.length(1);
            expect(body[0].app_name).to.be.equal('web.1');
            expect(body[0].command).to.be.equal('node server.js');
            expect(body[0].process).to.be.equal('web.1');
            done();
          });
        });
      });

      it('should return one instance when listing processes', function(done){
        request({
          url: base + '/apps/myApp/ps'
        }, function(err, res, body){
          if(err) return done(err);
          expect(res).to.have.status(200);
          expect(body).to.have.length(1);
          instanceId = body[0].id;
          expect(body[0].id).to.exist;
          expect(body[0].app_name).to.be.equal('web.1');
          expect(body[0].command).to.be.equal('node server.js');
          expect(body[0].process).to.be.equal('web.1');
          expect(body[0].rendezvous_url).to.be.null;
          expect(body[0].type).to.be.equal('Ps');
          expect(body[0].attached).to.be.equal(false);
          expect(body[0].pretty_state).to.include('up since');
          expect(body[0].state).to.be.equal('creating');
          done();
        });
      });

      ['starting', 'listening', 'running', 'completed', 'errored'].forEach(function(state){
        describe('updating the state to ' + state, function(){
          beforeEach(function(done){
            dynohostMock.getJobs(function(err, data){
              dynohostMock.updateState('myApp', data[0].dyno_id, data[0].dyno_hostname, data[0].instance_id, state, done);
            });
          });

          it('it should return the correct state when listing processes', function(done){
            request({
              url: base + '/apps/myApp/ps',
            }, function(err, res, body){
              if(err) return done(err);
              expect(res).to.have.status(200);
              expect(body).to.have.length(1);
              expect(body[0].state).to.be.equal(state);
              done();
            });
          });
        });
      });

      describe('when stopping the instance', function(){
        beforeEach(function(done){
          request.post({
            url: base + '/apps/myApp/ps/stop',
            qs: {
              type: 'web'
            },
            json: false
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.be.equal('ok');
            done();
          });
        });

        it('should return empty when listing processes', function(done){
          request({
            url: base + '/apps/myApp/ps'
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.be.empty;
            done();
          });
        });
      });

      describe('should return 1 instance when scaling nothing', function(){
        beforeEach(function(done){
          request.post({
            url: base + '/apps/myApp/ps/scale',
            qs: {
              type: 'web',
              qty: 1
            },
            json: false
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.be.equal('1');
            done();
          });
        });

        it('should return one process when listing processes', function(done){
          request({
            url: base + '/apps/myApp/ps'
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.have.length(1);
            done();
          });
        });
      });

      describe('should return 2 instances when scaling an app up', function(){
        beforeEach(function(done){
          request.post({
            url: base + '/apps/myApp/ps/scale',
            qs: {
              type: 'web',
              qty: 2
            },
            json: false
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.be.equal('2');
            done();
          });
        });

        it('should return 2 processes when listing processes', function(done){
          request({
            url: base + '/apps/myApp/ps'
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.have.length(2);
            expect(body[0].app_name).to.be.equal('web.2');
            expect(body[0].process).to.be.equal('web.2');
            done();
          });
        });
      });

      describe('should return 0 instance when scaling an app down', function(){
        beforeEach(function(done){
          request.post({
            url: base + '/apps/myApp/ps/scale',
            qs: {
              type: 'web',
              qty: 0
            },
            json: false
          }, function(err, res, body){
            if(err) return done(err);
            expect(res).to.have.status(200);
            expect(body).to.be.equal('0');
            done();
          });
        });

        it('should return empty when listing processes', function(done){
          request({
            url: base + '/apps/myApp/ps'
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

// TODO run-off command
// TODO workers
