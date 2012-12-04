var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var Assertion = chai.Assertion;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');
var preReceiveMock = require('./mock/codonhooks').preReceive;
var dynohostMock = require('./mock/dynohost');

before(common.startServer);

Assertion.addProperty('startJob', function (){
  var data = this._obj;
  expect(data.instance_id).to.exist;
  expect(data.dyno_id).to.exist;
  expect(data.rez_id).to.be.null;
  expect(data.template).to.be.equal('dyno');
  expect(data.name).to.be.equal('web.1');
  expect(data.env_vars).to.be.deep.equal({
    PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin'
  });
  expect(data.attached).to.be.false;
  expect(data.pty).to.be.false;
  expect(data.command).to.be.equal('node');
  expect(data.command_args).to.be.deep.equal(['server.js']);
  expect(data.logplex_id).to.exist;
  expect(data.mounts['/app']).to.exist;
  expect(data.created_at).to.exist;
  expect(data.next_action).to.be.equal('start');
  expect(data.distributed_at).to.be.null;
  expect(data.distributed_to).to.be.null;
  expect(data.kill_at).to.be.null;
  expect(data.kill_method).to.be.null;
});

Assertion.addProperty('killJob', function () {
  var data = this._obj;
  expect(data.instance_id).to.exist;
  expect(data.dyno_id).to.exist;
  expect(data.rez_id).to.be.null;
  expect(data.template).to.be.equal('dyno');
  expect(data.name).to.be.equal('web.1');
  expect(data.env_vars).to.be.deep.equal({
    PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin'
  });
  expect(data.attached).to.be.false;
  expect(data.pty).to.be.false;
  expect(data.command).to.be.equal('node');
  expect(data.command_args).to.be.deep.equal(['server.js']);
  expect(data.logplex_id).to.exist;
  expect(data.mounts['/app']).to.exist;
  expect(data.created_at).to.exist;
  expect(data.next_action).to.be.equal('start');
  expect(data.distributed_at).to.be.null;
  expect(data.distributed_to).to.be.null;
  expect(data.kill_at).to.be.null;
  expect(data.kill_method).to.be.null;
});

describe('internal provisionJob', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);
  beforeEach(common.addApp);

  var base = 'http://:' + common.defaultUser.apiKey + '@localhost:5000';

  describe('without a commit', function(){
    describe('when restarting an app', function(){
      before(function(done){
        request.post({
          url: base + '/apps/myApp/ps/restart',
          json: false
        }, done);
      });

      it('should not create provision job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.be.empty;
          done();
        });
      });
    });

    describe('when stopping an app', function(){
      before(function(done){
        request.post({
          url: base + '/apps/myApp/ps/stop',
          qs: {
            type: 'web'
          },
          json: false
        }, done);
      });

      it('should not create provision job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.be.empty;
          done();
        });
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
        }, done);
      });

      it('should create one "start" job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.have.length(1);
          expect(data[0]).to.be.startJob;
          done();
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

        it('should create one "kill" job', function(done){
          dynohostMock.getJobs(function(err, data){
            if(err) return done(err);
            expect(data).to.have.length(1);
            expect(data[0]).to.be.killJob;
            done();
          });
        });
      });

      describe('when scaling nothing', function(){
        beforeEach(function(done){
          request.post({
            url: base + '/apps/myApp/ps/scale',
            qs: {
              type: 'web',
              qty: 1
            },
            json: false
          }, done);
        });

        it('should not create provision job', function(done){
          dynohostMock.getJobs(function(err, data){
            if(err) return done(err);
            expect(data).to.be.empty;
            done();
          });
        });
      });

      describe('when scaling an app up', function(){
        beforeEach(function(done){
          request.post({
            url: base + '/apps/myApp/ps/scale',
            qs: {
              type: 'web',
              qty: 2
            },
            json: false
          }, done);
        });

        it('should create one "start" job', function(done){
          dynohostMock.getJobs(function(err, data){
            if(err) return done(err);
            expect(data).to.have.length(1);
            expect(data[0]).to.be.startJob;
            done();
          });
        });
      });

      describe('when scaling an app down', function(){
        beforeEach(function(done){
          request.post({
            url: base + '/apps/myApp/ps/scale',
            qs: {
              type: 'web',
              qty: 0
            },
            json: false
          }, done);
        });

        it('should create one "kill" job', function(done){
          dynohostMock.getJobs(function(err, data){
            if(err) return done(err);
            expect(data).to.have.length(1);
            expect(data[0]).to.be.killJob;
            done();
          });
        });
      });
    });
  });
});

// TODO fix failing tests
// TODO restart
// TODO rollback
// TODO config
// TODO run-off command
// TODO workers
// TODO gitaction
