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

/*
 * Track who authored what line.
 *
 *
 *
 */

module.exports = (function() {
  var public = {};

  //TODO store in the database
  var roomMap = {};

  public.getOrCreate = function(roomId) {
    return roomMap[roomId] || public.new(roomId);
  };

  public.load = function(roomId) {
    return roomMap[roomId];
  };

  public.new = function(roomId) {
    var room = new Room(roomId, []);

    roomMap[roomId] = room;

    return room;
  };

  return public;
})();

var Room = function(id, lines) {
  this.id = id;
  this.lines = lines;
};

//TODO break out lines into their own model?
Room.prototype.appendLine = function(author, linenumber, height, text, timestamp) {
  if (linenumber < this.lines.length) {
    this.lines.splice (linenumber, 0, {
      author: author,
      linenumber: linenumber,
      text: text,
      height: height,
      timestamp: timestamp
    });
  } else {
    this.lines.splice (linenumber, 1, {
      author: author,
      linenumber: linenumber,
      text: text,
      height: height,
      timestamp: timestamp
    });
  }
};
