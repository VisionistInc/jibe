//
//  logTool.js
//
//  - Adds a post route to append text to a document
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
//
var router = require('express').Router();
var config  = require('../config');
var rethink = require('livedb-rethinkdb')(config.rethinkdb);
var backend = require('livedb').client(rethink);

// Add text to the bottom of the document
router.post('/:id', function(req, res) {

  var operations = [];

  // operation to update the text
  operations.push({
    // TODO append to the end of the text, on a new line
    p: ['text', 0],
    si: req.query.text
  });
  // TODO add in lines information for the appended lines

  backend.submit('jibe', req.params.id, {op:operations}, function(err) {
    console.info("Writing log tool output to " + req.params.id + ": " +  req.query.text);
    // handle error
    if (err) {
      res.send({
        message: 'Error appending text to document',
        error: err
      });
    } else {
      res.sendStatus(200);
    }
  });
});

module.exports = router;
