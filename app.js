
var express         = require('express');
var Duplex          = require('stream').Duplex;
var browserChannel  = require('browserchannel').server;
var livedb          = require('livedb');
var sharejs         = require('share');
var shareCodeMirror = require('share-codemirror');
var server          = require('http').createServer(app);

var backend = livedb.client (livedb.memory ());
var share   = sharejs.server.createClient ({ backend: backend });
var app     = express ();

app.use (express.static (__dirname));
app.use (browserChannel (function (client) {
    var stream = new Duplex ({ objectMode: true });

    stream._write = function (chunk, encoding, callback) {
        if (client.state !== 'closed') {
          client.send (chunk);
        }
        callback ();
    };

    stream._read = function () {
        // Nothing special here; just reading from the stream
    };

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
}));

server.listen (port, function () {
    console.info ('Server listening at port %d', port);
});
