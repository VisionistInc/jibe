//
//  keywordreplace.js
//
//  - This is a CodeMirror addon to allow for the replacement of specified
//  - strings with a given value or result of a given function.
//
//  - cmInstance.registerKeywordReplacement('keyword', replacementValOrFunc);
//
//  - Then, any time a user enters '@<keyword>:<value>' and presses either the
//  - spacebar or enter key, that text will be replaced using the provided
//  - replacement value.
//
//  - Replacement functions should have the signature
//  -   function (value, callback) { ...; callback('<replacementString>'); }
//
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

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  // REs to look for keywords to replace
  var keywordRegex = /@([^\s:]+)[ ]?:[ ]?([^\s]+)\s/,
      keywordRegexEOL = /@([^\s:]+)[ ]?:[ ]?([^\s]+)$/;

  // map of keywords :: replacement values or functions
  var replacementMap = {};

  // create this as an option so it can be enabled / disabled,
  // and default to disabled
  CodeMirror.defineOption('keywordReplace', false, function(cm, val, old) {
    // if keywordReplace has been enabled for the cm instance,
    // create the extension and check for keywords on keyup
    if (val) {
      // this creates the extension for all future instances ... problem?
      CodeMirror.defineExtension('registerKeywordReplacement', registerReplacement);
      cm.on('keyup', checkForKeyword);
    }
  });

  // add a new keywords :: replacement pair to the replacementMap
  function registerReplacement(keyword, replacement) {
    replacementMap[keyword] = replacement;
  }

  // check the current line or the previous line (depending on the key pressed)
  // for the keyword pattern.  If a match is found, and if the keyword has been
  // registered in the keyword map, replace the match with the replacement.
  function checkForKeyword(cmInstance, event) {
    if (event.keyCode === 13 || event.keyCode === 32) {
      var cursor = cmInstance.getCursor (),
          lineNumber = cursor.line,
          lineContent,
          match;

      if (event.keyCode === 13) { // enter
        lineContent = cmInstance.getLine(--lineNumber);
        match = keywordRegexEOL.exec(lineContent);
      } else { // space
        lineContent = cmInstance.getLine(lineNumber);
        match = keywordRegex.exec(lineContent);
      }

      // if there was a match and a replacement has been registered, replace
      if (match) {
        var replacement = replacementMap[match[1]];

        // if a replacement exists for the given @key
        if (replacement) {
          // callback for replacement functions
          var replacementCallback = function(replacementText) {
            cmInstance.replaceRange(replacementText,
              {line: lineNumber, ch: match.index}, cursor);
          };

          if (typeof replacement === 'function') {
            replacement(match[2], replacementCallback);
          } else {
            replacementCallback(replacement);
          }
        }
      }
    }
  }
});
