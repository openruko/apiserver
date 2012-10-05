var express = require('express');

//Add a parser to handle arbitary text uploads such as when
//heroku CLI uploads ssh keys. A little hacky but seems to work
//well enough for now.

express.bodyParser.parse[''] = handleRaw
express.bodyParser.parse['text/plain'] = handleRaw

function handleRaw(req, options, fn) {
  req.setEncoding('utf8'); // should use req headers to determine?
  var content = '';
  req.on('data', function(data) {
    
    ///HACKY: Enforce upload limits to prevent memory DOS
    if(content.length >  1000000) {
      req.end();
      fn();
    }

    content += data;
  });
  req.on('end', function(data) {
    if(data) content += data; // required?
    req.raw = { body: content };
    fn();
  });
};

module.exports = express;
