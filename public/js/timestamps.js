
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
  this.colors     = [];

  /*
   *  Draws the timestamps into the given container.
   */
  this.draw = function (lines) {
    this.generateTimestamps (lines);
  };

  /*
   *  Returns a timestamp string based on the format.
   */
  this.getMoment = function (timestamp) {
    return moment (timestamp).format (this.format);
  };

  this.addAuthorColorCoding = function (author) {
    if (!(author.id in this.colors)) {
      this.colors[author.id] = author.color;
    }
  };

  this.processAuthorColorCoding = function (authors) {
    for (var i = 0; i < authors.length; i++) {
      if (!(authors[i].id in this.colors)) {
        this.colors[authors[i].id] = authors[i].color;
      }
    }
  };

  /*
   *  Draws the timestamps into its given container.
   */
  this.generateTimestamps = function (lines) {
    var content = '';
    var timestamps = [];
    var compare_date  = '';

    for (var i = 0; i < lines.length; i++) {
      var timestamp = $('<div>');

      var line = this.codemirror.getLineHandle (i);
      var date = this.getMoment (lines[i].timestamp);

      if (line.text !== '') {
        content += '<div class="timestamp" style="height: ' + line.height + 'px; border-right: 2.75px solid ' + this.colors[lines[i].client] + '" data-line="' + i + '" data-author="' + lines[i].client + '">';
        if (date !== compare_date) {
          content += '<p>' + date + '</p>';
          compare_date = date;
        }
        content += '</div>';
      } else {
        content += '<div class="blank-div" style="height: ' + line.height + 'px;"></div>';
        compare_date = '';
      }

      $(this.container).html (content);
    }

    this.activateTooltips ();
  };

  this.activateTooltips = function () {
    $('.timestamp')
      .mouseenter (function () {
        console.info ($(this).data ('author'));
      })
      .mouseleave (function () {
        // console.info ("Not hovering!");
      });
  };
}
