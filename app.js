var express         = require('express');
var Duplex          = require('stream').Duplex;
var browserChannel  = require('browserchannel').server;
var livedb          = require('livedb');
var sharejs         = require('share');
var shareCodeMirror = require('share-codemirror');
var backend         = livedb.client (livedb.memory ());
var share           = sharejs.server.createClient ({ backend: backend });
var app             = express ();
var server          = require('http').createServer(app);

//TODO, break this out into a config file.
var port            = 3000;

server.listen (port, function () {
    console.info ('Server listening at port %d', port);
});

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


/*
 *  Everything chat related
 */
 chatSessions = {};
app.use (browserChannel ({ base: "/chat" }, function (session) {
    chatSessions[session.id] = session;
    session.on ('message', function (data) {
        for (var id in chatSessions) {
          if (chatSessions.hasOwnProperty(id)) {
            chatSessions[id].send(data);
            console.log(chatSessions[id].send);
          }
        }
        console.log(data);
    });
    session.on('close', function(data) {
      delete chatSessions[session.id];
      console.log("Session " + session.id + " closing for reason: " + data);
  });
}));
