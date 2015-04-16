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


var es = require('elasticsearch'),
    authors = require('../models/Author.js'),
    rooms = require('../models/Room.js');

var es_client = new es.Client({
  host: 'localhost:9200'
});

var connectionHandler = function(socket) {
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
};

module.exports = connectionHandler;
