/*
simpleBC- a wrapper around BCSocket

usage:

app.use(simpleBC ({base: "/foobar"}, function(data) {
  this.broadcast(data); //sends the data back to all clients.
});

Your function gets called every time a piece of data comes in through the
browserchannel with the data that gets sent. Broadcast sends the message to all
connected clients.

TODO: maybe set up some sort of subscription groups for the different pads?

*/
var browserChannel = require('browserchannel').server;
module.exports = function(opts, onMessage) {
  this.sessions = {};
  this.broadcast = function(message) {
    for (var id in sessions) {
      if (sessions.hasOwnProperty(id)) {
        sessions[id].send(message);
      }
    }
  }
  return browserChannel(opts, function(session) {
    sessions[session.id] = session;
    session.on('message', function(data) {
      onMessage(data);
    });

    session.on('close', function(reason) {
      delete sessions[session.id];
    });
  });
}
