//
//  config/index.js
//
//  - Handles jibe's run configuration.
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

/*
 *  NOTE: this function is only exported the first time config is required.
 *  module.exports is then overwritten with the config that will be used for the
 *  rest of the time the process is alive.
 *
 */
module.exports = function(config) {

  if (config) {
    // if a config is supplied, use that
    console.info('Jibe using supplied configuration', config);

    module.exports = config;
  } else {
    // otherwise, look for a configuration based on the environment
    var environment = process.env.NODE_ENV || 'development';

    // environment specific configurations
    config = require('./env/' + environment);
    config.environment = environment;

    console.info('Jibe using environment configuration', config);
    module.exports = config;
  }
};
