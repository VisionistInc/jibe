var es = require('elasticsearch'),
    authors = require('../models/Author.js'),
    rooms = require('../models/Room.js');

var es_client = new es.Client({
  host: 'localhost:9200',
  //log: 'trace'
});

module.exports = {
  initialize: function(io) {
    var chat = io.of('/chat');
    var editor = io.of('/editor');

    chat.on('connection', function(socket) {
      socket.on('message', function(message) {
        
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

      // change to editor content, update editor information
      socket.on('change', function(data) {
        var room = rooms.getOrCreate(data.room),
            author = authors.getOrCreate(data.client),
            found = false;
        for (var i = 0; i < room.lines.length; i++) {
          if (room.lines[i].linenumber === data.line) {
            // if author changed, let other users know
            if (room.lines[i].author !== author) {
              room.lines[i].author = author;
              socket.to(room.id).emit('change', room.lines[i]);
            }

            // always update these?
            room.lines[i].height = data.height;
            room.lines[i].text = data.text;
            room.lines[i].timestamp = new Date();

            found = true;
            break;
          }
        }

        // append the new line, then inform other users in the room
        if (!found) {
          room.appendLine(author, data.line, data.height, data.text);
          socket.to(room.id).emit('change', room.lines[room.lines.length-1]);
        }
      });

      // subscribe to the given room
      socket.on('subscribe', function(roomId) {

        // join the requested room, send room information
        socket.join(roomId, function(error) {
          if (error) {
            console.error("an error occurred joining room with id " + roomId);
          } else {
            socket.emit('connected', rooms.getOrCreate(roomId));
          }
        });

      });
    });
  }
};
