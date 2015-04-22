//
//  chat.js
//
//  - sets up routes for fetching chat messages from ElasticSearch
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
var router = require('express').Router(),
    Chat   = require('../models/Chat'),
    config = require('../config'),
    thinky = require('thinky')(config.rethinkdb),
    r      = thinky.r;

// load up to 50 chat messages beginning at :start
router.get('/:id/:start', function(req, res) {
  var startNumber = Number(req.params.start);

  Chat.filter({roomId: req.params.id})
      .orderBy(r.desc('timestamp'))
      .slice(startNumber, startNumber + 50)
      .run()
  .then(function(result) {
    res.json(result);
  })
  .error(function(error) {
    console.error('Error retrieving chat logs!', error);
  });
});

module.exports = router;
