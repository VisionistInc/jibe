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
    Chat   = require('../models/Chat'),
    r      = require('../helpers/thinky').r;

var connectionHandler = function(socket) {
  var connectionState = {
    roomId: null,
    author: null
  };

  socket.on('message', function(message) {
    // create a new Chat record
    var chat = new Chat({
      roomId: connectionState.roomId,
      authorId: connectionState.author.id,
      message: message.message,
      timestamp: message.timestamp,
      color: connectionState.author.color
    });

    // save the new record to the database, then broadcast the new message
    chat.save().then(function(result) {
      socket.broadcast.to(result.roomId).emit('message', result);
    }).error(function(error) {
      console.log('chat.save.error', error);
    });
  });

  // Join the client to the room they are requesting to join, and send them
  // the initial information about the room that they will need.
  //
  // data
  // - roomId
  // - authorId
  socket.on('subscribe', function(data) {
    socket.join(data.roomId);

    connectionState.roomId = data.roomId;

    // inform everyone that this author has entered the room
    Author.getOrCreate(data.authorId, function(author) {
      socket.in(data.roomId).emit('authorJoined', author);
      socket.emit('authorJoined', author);

      connectionState.author = author;
    });

    // TODO
    // the name of the table here, 'jibe', is totally dependent on this line in jibe.js:
    //   var editor_bc  = setSocket ('bc', null, 'jibe', room, client);
    // what can we do to somehow standardize that?  can we put it in a config file?

    // get a list of the authors that have a line in this room to their name so
    // we can know what color and name to display on the lines that they wrote.
    r.table('jibe')
      .get(data.roomId)
      .getField('lines')
      .getField('client')
      .distinct()
      // At this point, we have a list of distinct authors that get credit
      // for at least one line on this pad.  Now, do a join with that list
      // against the authors table to retrieve the author information.
      .innerJoin(r.table('authors'), function(lineAuthor, author) {
        return lineAuthor.eq(author.getField('id'));
      })
      .getField('right') // only want the author objects
      .run()
      .then(function(authors) {
        // send this to the client that just subscribed
        socket.emit('lineAuthors', authors);
      }).error(function(error) {
        console.error('error retrieving room authors', error);
      });
  });

  socket.on('content', function (data) {});
  socket.on('disconnect', function (disconnect) {
    socket.broadcast.to(connectionState.roomId).emit('authorLeft', connectionState.author);
  });

  socket.on('typing', function(data) {
    socket.broadcast.to(data.roomId).emit('typing', data);
    //console.log(data.authorId + " is typing in room " + data.roomId + ": " + data.value);
  });
};

module.exports = connectionHandler;
