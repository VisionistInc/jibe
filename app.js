//
//  app.js
//
//  - Exports an express route including all Jibe components. Also handles
//    BrowserChannel for ShareJS; socket.io for chat and timestamps.
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

var express         = require('express');
var sassMiddleware  = require('node-sass-middleware');
var path            = require('path');
var chatRoutes      = require('./lib/routes/chat.js');
var chatHandler     = require('./lib/sockets/chat.js');
var browserChannelMiddleware = require('./lib/middleware/browserchannel.js');
var router = express.Router();

/**
 * This function creates and returns an Express 4 Router.
 *
 * As a side effect, creates the necessary socket channels using the given
 * socketIO object.
 *
 * Example usage:
 *
 * var express = require('express'),
 *     app = express(),
 *     server = require('http').createServer(app),
 *     io = require('socket.io').listen(server);
 *
 * var jibe = require('jibe');
 * app.use(jibe(io).router);
 * app.use(jibe.browserChannelMiddleware);
 */
exports.router = function(io) {
  // chat routes
  router.use('/chat', chatRoutes);

  router.use(
    sassMiddleware({
      src: __dirname + '/scss',
      dest: __dirname + '/public/styles',
      prefix: '/styles',
      debug: true,
    })
  );

  if(io) {
    io.of('/chat').on('connection', chatHandler);
  }

  router.use('/lib', express.static(path.join(__dirname, '/node_modules')));
  router.use(express.static(path.join(__dirname, '/public')));

  return router;
};

// app.use(jibe.browserChannelMiddleware)
exports.browserChannelMiddleware = browserChannelMiddleware;
