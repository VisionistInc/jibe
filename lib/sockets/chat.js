//
//  chat.js
//
//  - Handles everything dealing with Chat on the server side, except the REST
//    endpoints for fetching old chat messages.
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


var Author = require('../models/Author'),
    Room = require('../models/Room');

var Chat = require('../models/Chat');

var connectionHandler = function(socket) {
  socket.on('message', function(message) {

    if (message.roomId) {
      // Sets the room the sender is in
      var room = Room.getOrCreate(message.roomId);

      // retrieve (or create) the author to get the message color
      Author.getOrCreate(message.authorId, function(author) {
        if (!author) {
          console.error('chat.js#connectionHandler: error, no author');
          return;
        }

        // create a new Chat record
        var chat = new Chat({
          roomId: message.roomId,
          authorId: author.id,
          message: message.message,
          timestamp: message.timestamp,
          color: author.color
        });

        // save the new record to the database, then broadcast the new message
        chat.save().then(function(result) {
          socket.broadcast.to(room.id).emit('message', result);
        }).error(function(error) {
          console.log('chat.save.error', error);
        });
      });
    }
  });

  // Puts the socket in the room for the room the users are in
  socket.on('subscribe', function(roomId) {
    socket.join(roomId);
  });

  socket.on('content', function (data) {});
  socket.on('disconnect', function (disconnect) {});

  socket.on('typing', function(data) {
    socket.broadcast.to(data.roomId).emit('typing', data);
    //console.log(data.authorId + " is typing in room " + data.roomId + ": " + data.value);
  });
};

module.exports = connectionHandler;
