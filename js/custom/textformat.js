
//
//  textformat.js
//
//  - Simulated class that takes care of text-related formatting on a CodeMirror editor
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

function TextFormat (data) {
  this.codemirror = data.codemirror,

  /*
   *  Replaces current text to the formatted text.
   */
  this.replace = function (replacement) {
  	this.codemirror.replaceSelection (replacement);
  }

  /*
   *  Tells the wrapper function to add the bold markdown characters.
   */
  this.bold = function () {
    this.replace (this.wrapper ('**'));
  }

  /*
   *  Tells the wrapper function to add the italic markdown characters.
   */
  this.italic = function () {
    this.replace (this.wrapper ('_'));
  }

  /*
   *  Tells the wrapper function to add the monospace markdown characters.
   */
  this.monospace = function () {
    this.replace (this.mlWrapper ('`', '```'));
  }

  /*
   *  Wraps the selection in the characters specified.
   *  Handles the multi-line case, wrapping each individual line in said characters.
   */
  this.wrapper = function (characters) {
  	if (this.codemirror.somethingSelected ()) {
  		var selection = this.codemirror.getSelection ('\n');

  		// Wrap lines individually.
  		if (/\n/.test (selection)) {
  			return selection.split ("\n").map (this.wrapText (characters)).join ("\n");
  		}	else {
        // If there's no multiple lines, just deal with the one.
  			return this.wrapText (characters)(selection);
  		}
  	} else {
  		var index = this.codemirror.indexFromPos (this.codemirror.getCursor ());
      this.codemirror.replaceSelection (characters + characters);
      this.codemirror.setCursor (this.codemirror.posFromIndex (index + 2));
  	}
  }

  /*
   *  Returns a function that wraps the text in the characters specified.
   */
  this.wrapText = function (characters) {
  	return function (selection) {
  		if (/^\s*$/.test (selection)) {
  			return selection;
  		}

  		// Regex that picks apart the different pieces of the format.
  		var regex = new RegExp ("(.*)" + escapeRegExp (characters) + "(.*)" + escapeRegExp (characters) + "(.*)");

      // Test if the format is already applied:
  		if (regex.test (selection)) {
  			return regex.exec (selection).slice (1, 4).join ("");
  		} else {
  			return (characters + selection + characters);
  		}
  	}
  }

  /*
   * Multiline wrapper.
   * Inserts multi-line characters (mlCharacters) on new lines at beginning and end of the selection --
   * -- or just characters at the beginning and end of the line (if only one line is selected.)
   */
  this.mlWrapper = function (characters, mlCharacters) {
  	if (this.codemirror.somethingSelected ()) {
  		var selection = this.codemirror.getSelection ('\n');
  		if (/\n/.test (selection)) {
  			var regex = new RegExp ("([\\s\\S]*)" + escapeRegExp (mlCharacters) + "\\n([\\s\\S]*)\\n" + escapeRegExp (mlCharacters) + "([\\s\\S]*)");
  			if (regex.test (selection)) {
  				return regex.exec (selection).slice (1, 4).join ("");
  			} else {
  				return mlCharacters + "\n" + selection + "\n" + mlCharacters;
  			}
  		}	else {
  			return this.wrapper (characters);
  		}
  	}
  }

  /*
   *  Ripped out of a StackOverflow thread --
   *  -- http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
   *  (Escapes all the necessary special characters for regex)
   */
  function escapeRegExp (str) {
    return str.replace (/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
}
