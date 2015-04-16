var express         = require('express');
var sassMiddleware  = require('node-sass-middleware');
var path            = require('path');
var chatRoutes      = require('./lib/routes/chat.js');
var chatHandler     = require('./lib/sockets/chat.js');
var editorHandler   = require('./lib/sockets/editor.js');
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
    io.of('/editor').on('connection', editorHandler);
  }

  router.use('/lib', express.static(path.join(__dirname, '/node_modules')));
  router.use(express.static(path.join(__dirname, '/public')));

  return router;
};

// app.use(jibe.browserChannelMiddleware)
exports.browserChannelMiddleware = browserChannelMiddleware;
