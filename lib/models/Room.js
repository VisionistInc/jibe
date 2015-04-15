/**
 * Track who authored what line.
 *
 *
 *
 */

module.exports = (function() {
  var public = {};

  //TODO store in the database
  var roomMap = {};

  public.getOrCreate = function(roomId) {
    return roomMap[roomId] || public.new(roomId);
  };

  public.load = function(roomId) {
    return roomMap[roomId];
  };

  public.new = function(roomId) {
    var room = new Room(roomId, []);

    roomMap[roomId] = room;

    return room;
  };

  return public;
})();

var Room = function(id, lines) {
  this.id = id;
  this.lines = lines;
};

//TODO break out lines into their own model?
Room.prototype.appendLine = function(author, linenumber, height, text) {
  this.lines.push({
    author: author,
    linenumber: linenumber,
    text: text,
    height: height,
    timestamp: new Date()
  });
};
