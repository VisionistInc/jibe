
//
//  timestamps.js
//
//  - Simulated class that generates timestamps on the left side of the CodeMirror editor
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

function Timestamps (data) {
  this.client     = data.client;
  this.container  = data.container;
  this.codemirror = data.codemirror;
  this.format     = typeof data.format !== 'undefined' ? data.format : 'YYYY-MM-DD';

  /*
   *  Draws the timestamps into the given container.
   */
  this.draw = function () {
    this.generateTimestamps (this);
  };

  /*
   *  Searches for the timestamp attached to the line handle based on line number (index).
   */
  this.getTimestamp = function (index) {
    return this.codemirror.getLineHandle (index).timestamp;
  };

  /*
   *  Sets the timestamp for a specific line handle.
   */
  this.setTimestamp = function (index, timestamp) {
    this.codemirror.getLineHandle (index).timestamp = timestamp;
  };

  /*
   *  Looks up the timestamp div and sets the color for the specific author.
   */
  this.setAuthor = function (index, client) {
    this.codemirror.getLineHandle (index).client = client;
  };

  /*
   *  Looks up the timestamp div and sets the color for the specific author.
   */
   this.load = function (data) {
    var instance = this;
    setTimeout (function () {
      for (var i = 0; i < data.length; i++) {
        instance.setTimestamp (data[i].linenumber, data[i].timestamp);
        instance.setAuthor (data[i].linenumber, data[i].client);
      }
      instance.draw ();
    }, 25);
  }

  /*
   *  Draws the timestamps into its given container.
   */
  this.generateTimestamps = function (instance) {
    var content = '';
    instance.codemirror.eachLine (function (line) {
      setTimeout (function () {
        if (line.text !== '') {
          content += '<div class="timestamp-mine" style="height: ' + line.height + 'px;" data-line="' + instance.codemirror.getLineNumber (line) + '">';
          content += '<p>' + line.timestamp + '</p>';
          content += '</div>';
        } else {
          content += '<div class="blank-div" style="height: ' + line.height + 'px;"></div>';
        }
      }, 1);
    });
    setTimeout (function () {
      $(instance.container).html (content);
    }, 1);
  };

  /*
   *  Returns a timestamp string based on the format.
   */
  this.newDate = function () {
    return new Date ().toFormat (this.format);
  };
}
