var environment = process.env.NODE_ENV || 'development';

// environment specific configurations
var config = require('./env/' + environment);
config.environment = environment;

module.exports = config;
