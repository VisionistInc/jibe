
//
//  room.js
//
//  - Model for an editor room
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

var thinky = require('../helpers/thinky'),
    type   = thinky.type;

var Room = thinky.createModel('rooms', {
  id: type.string().required(),
  presentAuthors: type.array().default(function() {
      return [];
    }).schema(type.string())
});

// TODO can we create a relationship between presentAuthors and Author?

Room.defineStatic("getOrCreate", function(roomId, callback) {
  Room.get(roomId).then(function(room) {
    callback(room);
  }).error(function(error) {

    // author was not found in the database, so create a new one
    var newRoom = new Room({id: roomId});

    newRoom.save().then(function(room) {
      callback(room);
    }).error(function(error) {
      console.error("Room.js#getOrCreate: Error saving Room: ", room, error);
      callback(null);
    });
  });
});

module.exports = Room;
