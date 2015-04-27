
//
//  room.js
//
//  - Model for an editor room.  In most use cases, this probably does not need
//    to be stored in the database.  However, if the application needs to scale
//    to multiple servers, it would be necessary to have it then.
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
  presentAuthors: type.array()
    .default(function() {
      return [];
    })
    .schema(type.string())
    .validator(function(values) {
      return uniquenessValidator(values);
    })
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

// are all values unique?
function uniquenessValidator(values) {
  if (values.presentAuthors) {
    values = values.presentAuthors;
  }
  values.sort();

  for (var i = 0; i < values.length - 1; i++) {
    if (values[i] === values[i+1]) {
      // can throw error or return false
      // error allows supplying more detail
      throw new Error('Duplicate value [' + values[i] + '] found in Room.presentAuthors');
    }
  }

  return true;
}

module.exports = Room;
