
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

var rooms   = require ('../models/Room.js');
var authors = require ('../models/Author.js');

var connectionHandler = function (socket) {
  socket.on('change', function(data) {
    var room   = rooms.getOrCreate (data.room);

    room.diffPatch (data.diff);

    // console.info (data.diff);
    // console.info (room.lines);
    // console.info ("\n\n");

    var payload = room.lines;

    for (var i = 0; i < payload.length; i++) {
      console.info (payload[i].client);

      var author = authors.getOrCreate (payload[i].client).id;
      payload[i].client = author;

      if (payload[i].client.id instanceof Object) {
        console.error (payload[i].client.id);
      }
    }

    //console.info (payload);

    socket.emit ('change', {
      payload : room.lines
    });
  });

  /*
   *  Subscribe to the given room.
   */
  socket.on ('subscribe', function(roomId) {
    socket.join (roomId, function (error) {
      if (error) {
        console.error ("an error occurred joining room with id " + roomId);
      } else {
        socket.emit ('connected', rooms.getOrCreate (roomId));
      }
    });
  });

  /*
   *  Required --
   *  -- not including it would cause the server to crash on socket error.
   */
  socket.on ('error', function (error) {
    console.error (error);
  });
};

module.exports = connectionHandler;
