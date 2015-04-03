var express = require('express');
var Duplex = require('stream').Duplex;
var browserChannel = require('browserchannel').server;
var livedb = require('livedb');
var sharejs = require('share');
var shareCodeMirror = require('share-codemirror');

var backend = livedb.client(livedb.memory());
var share = sharejs.server.createClient({backend: backend});

var app = express();
var server = require('http').createServer(app);
var port = 3000;

app.use (express.static (__dirname));

app.use(browserChannel(function(client) {
  var stream = new Duplex({objectMode: true});
  stream._write = function (chunk, encoding, callback) {
    if (client.state !== 'closed') {
      client.send(chunk);
    }
    callback();
  };
  stream._read = function() {
  };
  stream.headers = client.headers;
  stream.remoteAddress = stream.address;
  client.on('message', function(data) {
    stream.push(data);
  });
  stream.on('error', function (msg) {
    client.stop();
  });

  client.on('close', function(reason) {
    stream.emit('close');
    stream.emit('end');
    stream.end();
  });
  return share.listen(stream);
}));
server.listen (port, function() {
    console.info ('Server listening at port %d', port);
});
