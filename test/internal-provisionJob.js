var chai = require('chai');
chai.use(require('chai-http'));
var expect = chai.expect;
var Assertion = chai.Assertion;
var _ = require('underscore');
var request = require('request').defaults({json: true});
var common = require('./common');
var preReceiveMock = require('./mock/codonhooks').preReceive;
var dynohostMock = require('./mock/dynohost');
var gitmouthMock = require('./mock/gitmouth');

before(common.startServer);

Assertion.addProperty('startJob', function (){
  var data = this._obj;
  expect(data.instance_id).to.exist;
  expect(data.dyno_id).to.exist;
  expect(data.rez_id).to.be.null;
  expect(data.template).to.be.equal('dyno');
  expect(data.attached).to.be.false;
  expect(data.pty).to.be.false;
  expect(data.command).to.be.equal('node');
  expect(data.command_args).to.be.deep.equal(['server.js']);
  expect(data.logplex_id).to.exist;
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
  expect(data.env_vars).to.be.deep.equal({
    PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin'
  });
  expect(data.name).to.be.equal('web.1');
  expect(data.attached).to.be.false;
  expect(data.pty).to.be.false;
  expect(data.command).to.be.equal('node');
  expect(data.command_args).to.be.deep.equal(['server.js']);
  expect(data.logplex_id).to.exist;
  expect(data.mounts['/app']).to.exist;
  expect(data.created_at).to.exist;
  expect(data.next_action).to.be.equal('kill');
  expect(data.distributed_at).to.exist;
  expect(data.distributed_to).to.be.equal('127.0.0.1');
  expect(data.kill_at).to.be.null;
  expect(data.kill_method).to.be.equal('explicit');
});

describe('internal provisionJob', function(){
  beforeEach(common.cleanDB);
  beforeEach(common.addUser);
  beforeEach(common.addSuperUser);
  beforeEach(common.addApp);

  var base = 'https://:' + common.defaultUser.apiKey + '@localhost:5000';

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


    it('it should create a "start" job when running a one-off process', function(done){
      request.post({
        url: base + '/apps/myApp/ps',
        qs: {
          command: 'bash'
        }
      }, function(err, resp, body){
        if(err) return done(err);
        expect(body.slug).to.exist;
        expect(body.command).to.be.equal('bash');
        expect(body.upid).to.be.exist;
        expect(body.process).to.be.equal('run.1');
        expect(body.action).to.be.equal('complete');
        expect(body.rendezvous_url).to.include('tcp://localhost:');
        expect(body.type).to.be.equal('Ps');
        expect(body.elapsed).to.be.equal(0);
        expect(body.attached).to.be.true;
        expect(body.transitioned_at).to.exist;
        expect(body.state).to.starting;
        done()
      });
      setTimeout(function(){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.have.length(1);
          expect(data[0].instance_id).to.be.null;
          expect(data[0].dyno_id).to.exist;
          expect(data[0].rez_id).to.exist;
          expect(data[0].template).to.be.equal('run');
          expect(data[0].name).to.be.equal('run');
          expect(data[0].env_vars).to.be.deep.equal({});
          expect(data[0].attached).to.be.true;
          expect(data[0].pty).to.be.true;
          expect(data[0].command).to.be.equal('bash');
          expect(data[0].command_args).to.be.deep.equal([]);
          expect(data[0].logplex_id).to.be.null;
          expect(data[0].mounts['/app']).to.be.null;
          expect(data[0].created_at).to.exist;
          expect(data[0].next_action).to.be.equal('start');
          expect(data[0].distributed_at).to.be.null;
          expect(data[0].distributed_to).to.be.null;
          expect(data[0].kill_at).to.be.null;
          expect(data[0].kill_method).to.be.null;
        });
      }, 30);
    });
  });

  describe('When executing a git action', function(){
    beforeEach(function(done){
      gitmouthMock.handleGitCommand('myApp');
      setTimeout(done, 100);
    });

    it('Should create a "start build" job', function(done){
      dynohostMock.getJobs(function(err, data){
        if(err) return done(err);
        expect(data).to.have.length(1);
        expect(data[0].instance_id).to.be.null;
        expect(data[0].dyno_id).to.exist;
        expect(data[0].rez_id).to.exist;
        expect(data[0].template).to.be.equal('build');
        expect(data[0].env_vars.slug_id).to.exist;
        expect(data[0].env_vars.dyno_web_url).to.exist;
        expect(data[0].env_vars.repo_put_url).to.exist;
        expect(data[0].env_vars.slug_put_url).to.exist;
        expect(data[0].env_vars.push_code_url).to.exist;
        expect(data[0].attached).to.be.true;
        expect(data[0].pty).to.be.false;
        expect(data[0].command).to.be.equal('/usr/bin/git-receive-pack');
        expect(data[0].command_args).to.be.deep.equal(['/app']);
        expect(data[0].logplex_id).to.be.null;
        expect(data[0].mounts['/app']).to.exist;
        expect(data[0].mounts['/tmp/buildpacks']).to.exist;
        expect(data[0].created_at).to.exist;
        expect(data[0].next_action).to.be.equal('start');
        expect(data[0].distributed_at).to.be.null;
        expect(data[0].distributed_to).to.be.null;
        expect(data[0].kill_at).to.be.null;
        expect(data[0].kill_method).to.be.null;
        done();
      });
    });
  });

  describe('with a commit an instance is started', function(){
    var instanceId;
    beforeEach(function(done){
      preReceiveMock('myApp', function(){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          // it should create one "start" job'
          expect(data).to.have.length(1);
          expect(data[0]).to.be.startJob;
          expect(data[0].name).to.be.equal('web.1');
          expect(data[0].env_vars).to.be.deep.equal({
            PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin',
          });
          expect(data[0].mounts['/app']).to.exist;
          done();
        });
      });
    });

    it('it should create a "start" job with good env vars when running a one-off process', function(done){
      request.post({
        url: base + '/apps/myApp/ps',
        qs: {
          command: 'bash'
        }
      }, function(err, resp, body){
        if(err) return done(err);
        done()
      });
      setTimeout(function(){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.have.length(1);
          expect(data[0].env_vars).to.be.deep.equal({
            PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin',
          });
        });
      }, 30);
    });

    it('it should handle heartbeats and increment an app\'s total heartbeats', function(done){
      var instance_id;
      preReceiveMock('myApp', function(){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          instance_id = data[0].instance_id;
          dynohostMock.incrementHeartbeat(instance_id, function(err, body){
            expect(body.rows[0].increment_heartbeat).to.be.greaterThan(0);
            done();
          });
        });
      });
    })

    describe('when updating the repo', function(){
      beforeEach(function(done){
        preReceiveMock('myApp', done);
      });

      it('should create one `start` and one `kill` job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.have.length(2);
          done();
        });
      });
    });

    describe('when changing the config', function(){
      beforeEach(function(done){
        common.addConfig(done)
      });

      it('should create a "kill" and a "start" job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.have.length(2);
          expect(data[0]).to.be.startJob;
          expect(data[0].name).to.be.equal('web.1');
          expect(data[0].env_vars).to.be.deep.equal({
            PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin',
            KEY1: 'VALUE1',
            KEY2: 'VALUE2'
          });
          expect(data[0].mounts['/app']).to.exist;

          expect(data[1]).to.be.killJob;
          done();
        });
      });

    });

    describe('when stopping processes with type web', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/stop',
          qs: {
            type: 'web'
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

    describe('when stopping process with a bad type', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/stop',
          qs: {
            type: 'badtype'
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

    describe.skip('when stopping the process', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/stop',
          qs: {
            ps: 'web.1'
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

    describe('when stopping a bad process', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/stop',
          qs: {
            ps: 'toto.1'
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

    describe('when doing a rollback of the instance', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/releases',
          qs: {
            rollback: 'v3'
          },
          json: false
        }, done)
      });

      it('should create a "kill" and a "start" job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.have.length(2);
          expect(data[0]).to.be.startJob;
          expect(data[0].env_vars).to.be.deep.equal({
            PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin'
          });
          expect(data[0].mounts['/app']).to.exist;
          expect(data[1]).to.be.killJob;
          done();
        });
      });
    });

    describe('when restarting  processes with type web', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/restart',
          qs: {
            type: 'web'
          },
          json: false
        }, done);
      });

      it('should create one "kill" job and one "start" job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.have.length(2);
          expect(data[0]).to.be.startJob;
          expect(data[0].env_vars).to.be.deep.equal({
            PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin'
          });
          expect(data[0].mounts['/app']).to.exist;
          expect(data[0].name).to.be.equal('web.1');
          expect(data[1]).to.be.killJob;
          done();
        });
      });
    });

    describe.skip('when restarting  processes with a bad type', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/restart',
          qs: {
            type: 'badtype'
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

    describe('when restarting  the processes', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/restart',
          qs: {
            ps: 'web.1'
          },
          json: false
        }, done);
      });

      it('should create one "kill" job and one "start" job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.have.length(2);
          expect(data[0]).to.be.startJob;
          expect(data[0].env_vars).to.be.deep.equal({
            PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin'
          });
          expect(data[0].mounts['/app']).to.exist;
          expect(data[0].name).to.be.equal('web.1');
          expect(data[1]).to.be.killJob;
          done();
        });
      });
    });

    describe.skip('when restarting a bad process', function(){
      beforeEach(function(done){
        request.post({
          url: base + '/apps/myApp/ps/restart',
          qs: {
            ps: 'toto'
          },
          json: false
        }, done);
      });

      it('should should not create provision job', function(done){
        dynohostMock.getJobs(function(err, data){
          if(err) return done(err);
          expect(data).to.be.empty;
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
          expect(data[0].env_vars).to.be.deep.equal({
            PATH: 'bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin'
          });
          expect(data[0].mounts['/app']).to.exist;
          expect(data[0].name).to.be.equal('web.2');
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


  it.skip('with a commit containing two processes, 2 instances are started', function(done){
    var instanceId;
    var pstable = [
      "pstable:",
       "  web: node server.js",
       "  worker: node worker.js",
    ].join('\n');
    preReceiveMock('myApp', pstable, function(){
      dynohostMock.getJobs(function(err, data){
        if(err) return done(err);
        // it should create one "start" job'
        expect(data).to.have.length(2);
        expect(data[0]).to.be.startJob;
        expect(data[0].name).to.be.equal('web.1');
        console.log(data[1])
        done();
      });
    });
  });
});

// TODO fix stop process `web.1`
// TODO fix restart process `web.1`
// TODO fix workers
