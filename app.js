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
  var editor = io.of('/editor');
  var stamps = io.of('/stamps');

  chat.on('connection', function(socket) {

    socket.on('message', function(message) {
      console.log("message", message);
      if (message.pad_id) {
        // Sets the pad the sender is in
        var room = rooms.getOrCreate(message.pad_id);

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

    // Puts the socket in the room for the pad the users are on
    socket.on('subscribe', function(roomId) {
      socket.join(roomId);
    });

    socket.on('content', function (data) {});
    socket.on('disconnect', function (disconnect) {});

    socket.on('typing', function(data) {
      socket.broadcast.to(data.pad_id).emit('typing', data);
      //console.log(data.client + " is typing on pad " + data.pad_id + ": " + data.value);
    });
  });

  editor.on('connection', function(socket) {
    console.log(socket, "made connection to /editor");

    // change to editor content, update author information
    socket.on('change', function(data) {
      var room = rooms.getOrCreate(data.pad_id),
          author = authors.getOrCreate(data.client),
          found = false;
      for (var i = 0; i < room.lines.length; i++) {
        if (room.lines[i].linenumber === data.line) {

          // if author changed, let other users know
          if (room.lines[i].author !== author) {
            room.lines[i].author = author;
            socket.to(room.id).emit('change', room.lines[i]);
          }

          found = true;
          break;
        }
      }

      // append the new line, then inform other users in the room
      if (!found) {
        room.appendLine(author, data.line);
        socket.to(room.id).emit('change', room.lines[room.lines.length-1]);
      }
    });

    socket.on('subscribe', function(roomId) {
      socket.join(roomId);
    });
  });

  stamps.on('connection', function(socket) {
    console.log('Someone\'s about to edit the pad (stamps)');

    socket.on('stamps', function(data) {
      socket.broadcast.to(data.pad_id).emit('stamps', data);
      //TODO create model
      //TODO can we integrate this with active_lines stuff?
    });

    socket.on('subscribe', function(roomId) {
      socket.join(roomId);
    });
  });
}
