var express         = require('express');
var es              = require('elasticsearch');
var es_client       = new es.Client({host: 'localhost:9200', log: 'trace'});
var sassMiddleware  = require('node-sass-middleware');
var path            = require('path');
var authors         = require('./lib/models/Author.js');
var rooms           = require('./lib/models/Room.js');
var chatRoutes      = require('./lib/routes/chat.js');
var browserChannelMiddleware = require('./lib/middleware/browserchannel.js');
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
 * app.use(jibe(io).router);
 * app.use(jibe.browserChannelMiddleware);
 */
exports.router = function(io) {
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

  // browser channel for shareJS communication
  //router.use(browserChannel({base: '/jibe'}, browserChannelFunction));

  if(io) {
    attachSockets(io);
  }

  router.use('/lib', express.static(path.join(__dirname, '/node_modules')));
  router.use(express.static(path.join(__dirname, '/public')));

  return router;
};

// app.use(jibe.browserChannelMiddleware)
exports.browserChannelMiddleware = browserChannelMiddleware;

function attachSockets(io) {
  /*
   *  Everything chat related
   */
  var chat   = io.of('/chat');
  var stamps = io.of('/stamps');

  chat.on('connection', function(socket) {
    console.info ("Someone has connected");

    // is this necessary to have out here?
    var room;

    socket.on('message', function(message) {
      console.log("message", message);
      if (message.pad_id) {
        // Sets the pad the sender is in
        room = rooms.getOrCreate(message.pad_id);

        // Processes color assignment for the user
        message.color = authors.getOrCreate(message.client).color;

        // TODO would this be more helpful at client?
        // message.author = author;

        // Sends the message to everyone except the sender
        socket.broadcast.to(room.id).emit('message', message);

        // Adds the message to ElasticSearch
        es_client.create({
          index: 'jibe',
          type:  'chat',
          body:  message
        });
      }
    });

    // Re-broadcast typing data to everyone else
    socket.on('active', function(data) {
      console.log("active", data);
      room = rooms.getOrCreate(data.pad_id);
      var author = authors.getOrCreate(data.client);

      var found = false;
      for (var i = 0; i < room.lines.length; i++) {
        console.log('active_lines', i, room.lines[i]);
        if (room.lines[i].line === data.line) {
          room.lines[i].line.author = author;
          found = true;
          break;
        }
      }

      if (!found) {
        room.appendLine(author, data.line);
      }
    });

    // Puts the socket in the room for the pad the users are on
    socket.on('subscribe', function(pad) {
      socket.join(pad);
    });

    socket.on('content', function (data) {});
    socket.on('disconnect', function (disconnect) {});

    socket.on('typing', function(data) {
      socket.broadcast.to(data.pad_id).emit('typing', data);
      //console.log(data.client + " is typing on pad " + data.pad_id + ": " + data.value);
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
