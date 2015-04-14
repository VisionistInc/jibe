var express         = require('express');
var Duplex          = require('stream').Duplex;
var browserChannel  = require('browserchannel').server;
var livedb          = require('livedb');
var sharejs         = require('share');
var shareCodeMirror = require('share-codemirror');
var backend         = livedb.client (livedb.memory ());
var share           = sharejs.server.createClient ({ backend: backend });
var es              = require('elasticsearch');
var es_client       = new es.Client({host: 'localhost:9200', log: 'trace'});
var sassMiddleware  = require('node-sass-middleware');
var path            = require('path');
var authors         = require('./lib/models/Author.js');
var chatRoutes      = require('./lib/routes/chat.js');
var router = express.Router();

/**
 * This function creates and returns an Express 4 Router.
 *
 * As a side effect, creates the necessary socket channels using the given
 * socketIO object.
 *
 * Example usage:
 *
 * var express = require('express'),
 *     app = express(),
 *     server = require('http').createServer(app),
 *     io = require('socket.io').listen(server);
 *
 * var jibe = require('jibe');
 * app.use(jibe(io));
 *
 */
module.exports = function(io) {
  // chat routes
  router.use('/chat', chatRoutes);

  router.use(
    sassMiddleware({
      src: __dirname + '/scss',
      dest: __dirname + '/public/styles',
      prefix: '/styles',
      debug: true,
    })
  );

  router.use (express.static (path.join(__dirname, '/public')));
  router.use ('/node_modules', express.static (path.join(__dirname, '/node_modules')));

  router.use (browserChannel (function (client) {
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

  if(io) {
    attachSockets(io);
  }

  return router;
};

function attachSockets(io) {
  /*
   *  Everything chat related
   */
  var chat   = io.of('/chat');
  var stamps = io.of('/stamps');

  var Pad = Pad || {};
  Pad.active_lines = {};

  chat.on('connection', function(socket) {
    console.info ("Someone has connected");
    Pad.pad_id = '';

    // Sets the pad the user is in before doing anything
    Pad.setPad = function (data, callback) {
      if (typeof data.pad_id !== 'undefined') {
        Pad.pad_id = data.pad_id;
        if (!(data.pad_id in Pad.active_lines)) {
          Pad.active_lines[data.pad_id] = [];
        }
        callback (data);
      }
    };

    Pad.refreshActiveLines = function (data, author) {
      if (Pad.active_lines[Pad.pad_id].length !== 0) {
        var found = false;
        for (var i = 0; i < Pad.active_lines[Pad.pad_id].length; i++) {
          if (Pad.active_lines[Pad.pad_id][i].line === data.line) {
            Pad.active_lines[Pad.pad_id][i].client = author.id;
            Pad.active_lines[Pad.pad_id][i].color = author.color;

            found = true;
            break;
          }
        }

        if (!found) {
          Pad.active_lines[Pad.pad_id].push ({
            client : author.id,
            line   : data.line,
            color  : author.color
          });
        }
      } else {
        Pad.active_lines[Pad.pad_id].push ({
          client : author.id,
          line   : data.line,
          color  : author.color
        });
      }
    };

    socket.on('message', function(message) {
      // Sets the pad the sender is in
      Pad.setPad (message, function (message) {
        // Processes color assignment for the user
        var author = authors.getOrCreate(message.client);
        message.color = author.color;

        // Sends the message to everyone except the sender
        socket.broadcast.to(Pad.pad_id).emit('message', message);

        // Adds the message to ElasticSearch
        es_client.create({
          index: 'jibe',
          type:  'chat',
          body:  message
        });
      });
    });

    socket.on ('content', function (data) {

    });

    // Remove the user from the list of active colors on disconnects
    socket.on('disconnect', function (disconnect) {
      //Pad.setPad (disconnect, Pad.removeUser);
    });

    socket.on('typing', function(data) {
      socket.broadcast.to(data.pad_id).emit('typing', data);
      console.log(data.client + " is typing on pad " + data.pad_id + ": " + data.value);
    });

    // Re-broadcast typing data to everyone else
    socket.on('active', function(data) {
      Pad.setPad (data, function (data) {
        var author = authors.getOrCreate(data.client);
        Pad.refreshActiveLines (data, author);
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
}
