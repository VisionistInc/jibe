var thinky = require('../helpers/thinky'),
    type   = thinky.type,
    r      = thinky.r;

var Chat = thinky.createModel('chat', {
  id: type.string().default(r.uuid()),
  roomId: type.string().required(),
  authorId: type.string().required(),
  message: type.string().required(),
  timestamp: type.date().default(new Date()),
  // TODO this will eventually be joined in by authorId
  color: type.string().required()
});

// TODO establish relationship with Author
// Chat.belongsTo(Author, "author", "authorId", "id");

// TODO index common search fields (room, timestamp)

module.exports = Chat;
