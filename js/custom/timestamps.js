
//
//  timestamps.js
//
//  - Simulated class that generates timestamps on the left side of the Code
//
//  Copyright (c) 2015 Visionist, Inc.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy of this
//  software and associated documentation files (the "Software"), to deal in the Software
//  without restriction, including without limitation the rights to use, copy, modify, merge,
//  publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
//  to whom the Software is furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all copies or
//  substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
//  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

function Timestamps (data) {
  this.container  = data.container;
  this.codemirror = data.codemirror;
  this.format     = typeof data.format !== 'undefined' ? data.format : 'YYYY-MM-DD';
  this.lines      = [];

  /*
   *  Draws the timestamps into the given container.
   */
  this.draw = function () {
    var lines = processEditorLines (this);
    this.generateTimestamps (lines);
  }

  /*
   *  Searches for a timestamp based on specific line text.
   *  If unfound, returns a brand new timestamp.
   */
  this.getTimestamp = function (text) {
    if (text !== '' || typeof text !== 'undefined') {
      if (this.lines.length > 0) {
        for (var i = 0; i < this.lines.length; i++) {
          if (this.lines[i].text === text) {
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
        content += '<div class="timestamp-mine" style="height: ' + lines[i].height + 'px;" data-line="' + i + '">';
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

  /*
   *  Parses out line-specific CodeMirror data.
   */
  function processEditorLines (instance) {
    var cursor = instance.codemirror.getCursor ();
    var lines  = [];
    var array  = [];
    var number = 0;

    for (var i = 0; i < instance.codemirror.doc.children.length; i++) {
      for (var j = 0; j < instance.codemirror.doc.children[i].lines.length; j++) {
        var line = instance.codemirror.doc.children[i].lines[j];
        console.info (cursor.line);
        lines.push ({
					line      : number,
					height    : line.height,
					text      : line.text,
					timestamp : cursor.line === number ? instance.newDate () : instance.getTimestamp (line.text),
					author    : clientID
				});
        number++;
      }
    }

    return lines;
  }

}
