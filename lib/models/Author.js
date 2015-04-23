
//
//  Author.js
//
//  - Thinky model for Author records.  An author contains an id and a color.
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

var please = require ('pleasejs'),
    thinky = require('../helpers/thinky'),
    type   = thinky.type,
    r      = thinky.r;

var Author = thinky.createModel('authors', {
  id: type.string().default(r.uuid()),
  color: type.string().default(newColor())
});

// TODO establish relationship with Chat
// Author.hasMany(Chat, "messages", "id", "authorId");

// #getOrCreate
//
// Attempt to retrieve an author with the provided id from the database.  If one
// does not exist, create a new author with the id.  Return the author via the
// provided callback function.
//
// - authorId: retrieve author with this id if it exists
//             otherwise, create a new author that has this id
// - callback: callback function will hold Author if successful, null otherwise
Author.defineStatic("getOrCreate", function(authorId, callback) {
  Author.get(authorId).then(function(author) {
    callback(author);
  }).error(function(error) {

    // author was not found in the database, so create a new one
    var newAuthor = new Author({id: authorId});

    newAuthor.save().then(function(author) {
      callback(author);
    }).error(function(error) {
      console.error("Author.js#getOrCreate: Error saving Author: ", author, error);
      callback(null);
    });
  });
});

function newColor() {
  return please.make_color({
    saturation : 1.0,
    value      : 0.8
  })[0];
}

module.exports = Author;
