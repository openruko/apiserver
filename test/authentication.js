var chai = require('chai')
chai.use(require('chai-http'));
var expect = chai.expect;
var _ = require('underscore');
var db = require('../apiserver/apidb');
var dbfacade = require('../apiserver/dbfacade')(db);
var conf = require('../apiserver/conf');
var request = require('request');

var user = {
  email: 'test@test.com',
  name: 'test',
  password: 'test',
  apiKey: '28790f7a7e2a33a7d12b0d5206cbc36020a36649'
};

describe('Authentication', function(){

  before(function(done){
    dbfacade.init(function(){
      dbfacade.exec('addUser', _({isSuperUser: false}).defaults(user), function(err, results){
        if(err) {
          if(/duplicate key value violates unique constraint "users_email_key"/.test(err)) return done()
          done(err);
        }
        //console.log(results.rows[0]);
      });
    })
  });

  it('should succeed', function(done){
    request({
      url: 'http://:' + user.apiKey + '@localhost:5000/apps',
      json: true
    }, function(err, res, body){
      if(err) return done(err);
      expect(res).to.have.status(200);
    });
  })

});
