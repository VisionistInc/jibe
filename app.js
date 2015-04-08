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
        // Nothing special here; just reading from the stream...
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
  es_client.search({
    index: 'visionpad',
    type: 'chat',
    size: 50,
    q: "pad_name:" + req.param('padid'),
    sort: "timestamp:desc",
    from: req.param('start')

  }).then(function(results) { res.json(results.hits.hits)});
});


/*
 *  Everything chat related
 */
var chat   = io.of('/chat');
var stamps = io.of('/stamps');

chat.on('connection', function(socket) {
  console.info ("Someone has connected");

  var ChatRoom = ChatRoom || {};
  var colors   = [];

  ChatRoom.newColor = function (message) {
    return please.make_color ({
      saturation : 1.0,
      value      : 0.8
    })[0];
  }

  ChatRoom.addUser = function (message) {
    colors.push ({
      client: message.client,
      color: ChatRoom.newColor ()
    });
  }

  ChatRoom.searchForColor = function (message) {
    for (var i = 0; i < colors.length; i++) {
      if (colors[i].client === message.client) {
        return colors[i].color;
      }
    }
  }

  ChatRoom.removeUser = function (message) {
    for (var i = 0; i < colors.length; i++) {
      if (colors[i].client === message.client) {
        delete colors[i];
        return;
      }
    }
  }

  socket.on('message', function(message) {
    if (message.type === 'bubble') {
      if (colors.length !== 0) {
        message.color = ChatRoom.searchForColor (message);
        if (typeof message.color === 'undefined') {
          ChatRoom.addUser (message);
          message.color = ChatRoom.searchForColor (message);
        }
      } else {
        ChatRoom.addUser (message);
        message.color = ChatRoom.searchForColor (message);
      }

      socket.broadcast.to(message.pad_id).emit('message', message);
    } else {
      ChatRoom.removeUser (message);
    }
    socket.broadcast.to(message.pad_id).emit('message', message);

    //Add the message to elasticsearch:
    es_client.create({
      index: 'visionpad',
      type:  'chat',
      body:  message
    });
  });

  socket.on('typing', function(data) {
    socket.broadcast.to(data.pad_id).emit('typing', data);
    console.log(data.client + " is typing on pad " + data.pad_id + ": " + data.value);
  });

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
