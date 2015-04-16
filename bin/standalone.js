//
//  standalone.js
//
//  - sets up a standalone Jibe instance.
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

var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    jibe = require('../app.js');

// initialize jibe
app.use(jibe.router(io));
app.use(jibe.browserChannelMiddleware);

// start server TODO config for port
var port = 3000;
server.listen (port, function () {
    console.info ('Server listening at port %d', port);
});
