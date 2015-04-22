
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
  this.draw = function (lines) {
    this.generateTimestamps (lines);
  };

  /*
   *  Draws the timestamps into its given container.
   */
  this.generateTimestamps = function (lines) {
    var content = '';

    for (var i = 0; i < lines.length; i++) {
      var line = this.codemirror.getLineHandle(i);
      if (line.text !== '') {
        content += '<div class="timestamp-mine" style="height: ' + line.height + 'px;" data-line="' + i + '">';
        content += '<p>' + lines[i].timestamp + '</p>';
        content += '</div>';
      } else {
        content += '<div class="blank-div" style="height: ' + line.height + 'px;"></div>';
      }
    }

    $(this.container).html(content);
  };

  /*
   *  Returns a timestamp string based on the format.
   */
  this.newDate = function () {
    return new Date ().toFormat (this.format);
  };
}
