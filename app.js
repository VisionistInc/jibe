var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = 8080;

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname));


io.on('connection', function(socket) {
  console.log("Incoming connection");
  socket.on('chat', function(data) {
    console.log(data);
  });
});
