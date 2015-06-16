//
//  logTool.js
//
//  - sets up routes for appending text from the command line to a pad
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

// Add text to the bottom of the pad
router.post('/:id', function(req, res) {

  var textData = "";
  req.on('data', function (chunk) {
    textData = chunk;
    backend.submit('jibe', req.params.id, {op:[{p:['text', 0], si: textData }]}, function(err) {
      console.info("Writing log tool output to " + req.params.id + ": " +  textData);
      // handle case of an error
    })
  });

  ;
});

module.exports = router;