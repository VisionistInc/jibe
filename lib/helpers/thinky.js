var config = require('../config'),
    thinky = require('thinky');

module.exports = thinky(config.rethinkdb);
