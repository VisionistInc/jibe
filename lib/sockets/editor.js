//
//  editor.js
//
//  - class that handles the timestamps and whatnot on the server side.
//
//  Copyright (c) 2015 Visionist, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

var authors = require('../models/Author.js'),
    rooms = require('../models/Room.js');

var connectionHandler = function(socket) {

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
};

module.exports = connectionHandler;
