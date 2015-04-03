var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = 3000;

server.listen (port, function() {
    console.info ('Server listening at port %d', port);
});

app.use (express.static (__dirname));

io.on('connection', function (socket) {
    console.info ("A user has connected");

    // Detects whenever a user disconnects
    socket.on('disconnect', function(){
        console.log('A user has disconnected');
    });

    // Sends message to every user in 'chat' room
    socket.on ('chat', function (data) {;
        // console.info (data);
        // io.emit ('chat', data);
    });
});
