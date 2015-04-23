//
//  browserchannel.js
//
//  - Sets up BrowserChannel for shareJS; returns a browserChannel.
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
var Duplex          = require('stream').Duplex;
var browserChannel  = require('browserchannel').server;

// set up sharejs backend
var config  = require('../config');
var rethink = require('livedb-rethinkdb')(config.rethinkdb);
var backend = require('livedb').client(rethink);
var share   = require('share').server.createClient({ backend: backend });

module.exports = browserChannel({}, function(client) {
  console.log("new channel " + client.id + " from " + client.address);
  var stream = new Duplex ({ objectMode: true });

  stream._write = function (chunk, encoding, callback) {
    if (client.state !== 'closed') {
      client.send (chunk);
    }
    callback ();
  };

  stream._read = function () {};

  stream.headers = client.headers;
  stream.remoteAddress = stream.address;

  client.on ('message', function (data) {
    stream.push (data);
  });

  stream.on ('error', function (message) {
    client.stop ();
  });

  client.on ('close', function (reason) {
    stream.emit ('close');
    stream.emit ('end');
    stream.end ();
  });

  return share.listen (stream);
});
