var Duplex          = require('stream').Duplex;
var browserChannel  = require('browserchannel').server;
var livedb          = require('livedb');
var sharejs         = require('share');
var shareCodeMirror = require('share-codemirror');
var backend         = livedb.client (livedb.memory ());
var share           = sharejs.server.createClient ({ backend: backend });

module.exports = browserChannel({}, function(client) {
  console.log("new channel " + client.id + " from " + client.address);
  var stream = new Duplex ({ objectMode: true });

  stream._write = function (chunk, encoding, callback) {
    if (client.state !== 'closed') {
      client.send (chunk);
    }
    callback ();
  };

  stream._read = function () {};

  stream.headers = client.headers;
  stream.remoteAddress = stream.address;

  client.on ('message', function (data) {
    stream.push (data);
  });

  stream.on ('error', function (message) {
    client.stop ();
  });

  client.on ('close', function (reason) {
    stream.emit ('close');
    stream.emit ('end');
    stream.end ();
  });

  return share.listen (stream);
});
