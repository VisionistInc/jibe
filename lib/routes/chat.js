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
var elasticsearch = require('elasticsearch'),
    router = require('express').Router(),
    es_client = new elasticsearch.Client({
      host: 'localhost:9200',
      //log: 'trace'
    });

// load up to 50 chat messages beginning at :start
router.get('/:id/:start', function(req, res) {
  console.log(req.params.id, req.params.start);
  es_client.search({
    index: 'jibe',
    ignore_unavailable: true,
    type: 'chat',
    size: 50,
    q: "pad_id:" + req.params.id,
    sort: "timestamp:desc",
    from: req.params.start
  }).then(function(results) {
      res.json(results.hits.hits);
  });
});

module.exports = router;
