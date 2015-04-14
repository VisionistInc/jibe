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
