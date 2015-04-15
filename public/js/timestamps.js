
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
  this.lines      = [];

  /*
   *  Draws the timestamps into the given container.
   */
  this.draw = function () {
    processEditorLines (this, function (instance, lines) {
      instance.generateTimestamps (lines);
    });
  }

  /*
   *  Searches for a timestamp based on specific line text.
   *  If unfound, returns a brand new timestamp.
   */
  this.getTimestamp = function (text) {
    if (text !== '' || typeof text !== 'undefined') {
      if (this.lines.length > 0) {
        for (var i = 0; i < this.lines.length; i++) {
          if (this.lines[i].text == text) {
            return this.lines[i].timestamp;
          }
        }
      }
      return this.newDate ();
    } else {
      return null;
    }
  }

  /*
   *  Draws the timestamps into its given container.
   */
  this.generateTimestamps = function (lines) {
    var content = '';
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].text !== '') {
        content += '<div class="timestamp-mine" style="height: ' + lines[i].height + 'px;">';
        content += '<p>' + lines[i].timestamp + '</p>';
        content += '</div>';
      } else {
        content += '<div class="blank-div" style="height: ' + lines[i].height + 'px;"></div>';
      }
    }
    $(this.container).html (content);
    this.lines = lines;
  }

  /*
   *  Returns a timestamp string based on the format.
   */
  this.newDate = function () {
    return new Date ().toFormat (this.format);
  }

  this.setTimestampAuthorColor = function () {

  }

  /*
   *  Parses out line-specific CodeMirror data.
   */
  function processEditorLines (instance, callback) {
    var cursor = instance.codemirror.getCursor ();
    var lines  = [];
    var number = 0;

    /*
     *  From the CodeMirror API --
     *  -- iterates through entire document, line by line..
     */
    instance.codemirror.eachLine (function (line) {
      setTimeout (function () {
        lines.push ({
          line      : number,
          height    : line.height,
          text      : line.text,
          timestamp : cursor.line === number ? instance.newDate () : instance.getTimestamp (line.text),
          author    : instance.client
        });
      }, 1);
    });

    /*
     *  Don't ask.
     */
    setTimeout (function () {
      callback (instance, lines);
    }, 1);
  }
}
