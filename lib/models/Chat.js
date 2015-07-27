
//
//  Chat.js
//
//  - Thinky model for Chat records.
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
    type   = thinky.type,
    r      = thinky.r;

var Chat = thinky.createModel('chat', {
  id: type.string().default(r.uuid()),
  roomId: type.string().required(),
  authorId: type.string().required(),
  message: type.string().required(),
  timestamp: type.date().default(function() {
  	sleep(1);
  	return new Date();
  }),
  // TODO this will eventually be joined in by authorId
  color: type.string().required()
});

// TODO establish relationship with Author
// Chat.belongsTo(Author, "author", "authorId", "id");

// TODO index common search fields (room, timestamp)

module.exports = Chat;

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}