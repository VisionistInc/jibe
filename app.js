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
var io              = require('socket.io').listen(server);
var please          = require ('pleasejs');
var es              = require('elasticsearch');
var es_client       = new es.Client({
  host: 'localhost:9200',
  log: 'trace'
});

var path = require('path');


//TODO, break this out into a config file.
var port            = 3000;

server.listen (port, function () {
    console.info ('Server listening at port %d', port);
});

app.use (express.static (path.join(__dirname, '/public')));
app.use ('/node_modules', express.static (path.join(__dirname, '/node_modules')));

app.use (browserChannel (function (client) {
    var stream = new Duplex ({ objectMode: true });

    stream._write = function (chunk, encoding, callback) {
      if (client.state !== 'closed') {
        client.send (chunk);
      }
      callback ();
    };

    stream._read = function () {

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

app.get('/chat/:padid/:start', function(req, res) {
  console.log(req.params.padid, req.params.start);
  es_client.search({
    index: 'visionpad',
    ignore_unavailable: true,
    type: 'chat',
    size: 50,
    q: "pad_id:" + req.params.padid,
    sort: "timestamp:desc",
    from: req.params.start
  }).then(function(results) { res.json(results.hits.hits)});
});


/*
 *  Everything chat related
 */
var chat   = io.of('/chat');
var stamps = io.of('/stamps');

var Pad = Pad || {};
Pad.colors = {};
Pad.active_lines = {};

chat.on('connection', function(socket) {
  console.info ("Someone has connected");
  Pad.pad_id = '';

  // Creates a new color by PleaseJS
  Pad.newColor = function (message) {
    return please.make_color ({
      saturation : 1.0,
      value      : 0.8
    })[0];
  }

  // Sets the pad the user is in before doing anything
  Pad.setPad = function (data, callback) {
    if (typeof data.pad_id !== 'undefined') {
      Pad.pad_id = data.pad_id;
      if (!(data.pad_id in Pad.colors)) {
        Pad.colors[data.pad_id] = [];
      }
      if (!(data.pad_id in Pad.active_lines)) {
        Pad.active_lines[data.pad_id] = [];
      }
      callback (data);
    }
  }

  // Registers the user in server, assigning a color
  Pad.setUser = function (message) {
    if (Pad.colors[Pad.pad_id].length !== 0) {
      var color = Pad.searchForColor (message);
      if (typeof color === 'undefined') {
        Pad.colors[Pad.pad_id].push ({
          client: message.client,
          color: Pad.newColor ()
        });
      }
    } else {
      Pad.colors[Pad.pad_id].push ({
        client: message.client,
        color: Pad.newColor ()
      });
    }
  }

  // Searches the colors object for the user
  Pad.searchForColor = function (message) {
    for (var i = 0; i < Pad.colors[Pad.pad_id].length; i++) {
      if (Pad.colors[Pad.pad_id][i].client === message.client) {
        //console.info (Pad.colors[Pad.pad_id][i].color);
        return Pad.colors[Pad.pad_id][i].color;
      }
    }
  }

  // Removes the user from the colors object
  Pad.removeUser = function (disconnect) {
    for (var i = 0; i < Pad.colors[Pad.pad_id].length; i++) {
      if (Pad.colors[Pad.pad_id][i].client === disconnect.client) {
        delete Pad.colors[Pad.pad_id][i];
        return;
      }
    }
  }

  Pad.refreshActiveLines = function (data) {
    if (Pad.active_lines[Pad.pad_id].length !== 0) {
      var found = false;
      for (var i = 0; i < Pad.active_lines[Pad.pad_id].length; i++) {
        if (Pad.active_lines[Pad.pad_id][i].line === data.line) {
          Pad.active_lines[Pad.pad_id][i].client = data.client;
          Pad.active_lines[Pad.pad_id][i].color  = Pad.searchForColor (data);
          found = true;
          break;
        }
      }

      if (!found) {
        Pad.active_lines[Pad.pad_id].push ({
          client : data.client,
          line   : data.line,
          color  : Pad.searchForColor (data)
        });
      }
    } else {
      Pad.active_lines[Pad.pad_id].push ({
        client : data.client,
        line   : data.line,
        color  : Pad.searchForColor (data)
      });
    }
  }

  socket.on('message', function(message) {
    // Sets the pad the sender is in
    Pad.setPad (message, function (message) {
      // Processes color assignment for the user
      Pad.setUser (message);
      message.color = Pad.searchForColor (message);

      // Sends the message to everyone except the sender
      socket.broadcast.to(Pad.pad_id).emit('message', message);

      // Adds the message to ElasticSearch
      es_client.create({
        index: 'visionpad',
        type:  'chat',
        body:  message
      });
    });
  });

  socket.on ('content', function (data) {

  });

  // Remove the user from the list of active colors on disconnects
  socket.on('disconnect', function (disconnect) {
    Pad.setPad (disconnect, Pad.removeUser);
  });

  socket.on('typing', function(data) {
    socket.broadcast.to(data.pad_id).emit('typing', data);
    console.log(data.client + " is typing on pad " + data.pad_id + ": " + data.value);
  });

  // Re-broadcast typing data to everyone else
  socket.on('active', function(data) {
    Pad.setPad (data, function (data) {
      Pad.setUser (data);
      Pad.refreshActiveLines (data);
      console.info (Pad.active_lines);
    });
  });

  // Puts the socket in the room for the pad the users are on
  socket.on('subscribe', function(pad) {
    socket.join(pad);
  });
});

stamps.on('connection', function(socket) {
  console.log('Someone\'s about to edit the pad (stamps)');

  socket.on('stamps', function(data) {
    socket.broadcast.to(data.pad_id).emit('stamps', data);
    //TODO store the data in elasticsearch
  });

  socket.on('subscribe', function(pad) {
    socket.join(pad);
  });
});
