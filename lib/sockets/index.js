var es = require('elasticsearch'),
    authors = require('../models/Author.js'),
    rooms = require('../models/Room.js');
var chat = require('./chat');

var es_client = new es.Client({
  host: 'localhost:9200',
  //log: 'trace'
});

module.exports = {
  initialize: function(io) {
    io.of('/chat').on('connection', chat);

    io.of('/editor').on('connection', function(socket) {

      // change to editor content, update editor information
      socket.on('change', function(data) {
        var room   = rooms.getOrCreate(data.room),
            author = authors.getOrCreate(data.client),
            found  = false;

        for (var i = 0; i < room.lines.length; i++) {
          if (room.lines[i].linenumber === data.line) {
            // if author changed, let other users know

            if (room.lines[i].author !== author) {
              room.lines[i].author = author;
              room.lines[i].text   = data.text;
              socket.to(room.id).emit('change', room.lines[i]);
            }

            // always update these?
            room.lines[i].height = data.height;
            room.lines[i].text = data.text;
            // room.lines[i].timestamp = new Date ();
            room.lines[i].timestamp = data.timestamp;

            found = true;
            break;
          }
        }

        // append the new line, then inform other users in the room
        if (!found) {
          room.appendLine(author, data.line, data.height, data.text, data.timestamp);
          socket.to(room.id).emit('change', room.lines[room.lines.length-1]);
        }

        console.info (room.lines);
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
