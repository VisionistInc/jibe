
//
//  share-codemirror-json.js
//
//  - Synchronizes JSON documents between ShareJS and CodeMirror
//
//  Credit to share-codemirror, this is taken as much as possible from that.
//  - https://github.com/share/share-codemirror
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

(function () {
  'use strict';

  /**
   * @param cm - CodeMirror instance
   * @param ctx - Share context
   * @param timestamps.client - unique identifier for timestamps.client
   */
  function shareCodeMirror(cm, ctx, timestamps) {
    if (!ctx.provides.json) throw new Error('Cannot attach to non-json document');

    var suppress = false;

    // fetch initial document from sharejs
    var doc = ctx.get();

    cm.setValue(doc.text);

    check();

    var textListenerPath = ['text'];
    var textInsertHandler = function(startPos, insertedText) {
      //console.log('text listener insert', startPos, insertedText);

      // suppress changes until this op has been incorporated
      suppress = true;

      // add in the inserted text we received from the sharejs context
      cm.replaceRange(insertedText, cm.posFromIndex(startPos));
      suppress = false;

      // now, make sure we are in sync with remote document
      check();
    };

    // on remote inserts to the 'text' attribute of our document,
    // run the textInsertHandler function
    var textInsertListener = ctx.addListener(
      textListenerPath,
      'insert',
      textInsertHandler
    );

    var textDeleteHandler = function(startPos, deletedText) {
      //console.log('text listener delete', startPos, deletedText);
      suppress = true;
      var from = cm.posFromIndex(startPos);
      var to = cm.posFromIndex(startPos + deletedText.length);
      cm.replaceRange('', from, to);
      suppress = false;

      // check to make sure document is in sync, draw updated timestamps
      check();
    };

    var textDeleteListener = ctx.addListener(
      textListenerPath,
      'delete',
      textDeleteHandler
    );

    cm.on('change', onLocalChange);

    function onLocalChange(cm, change) {
      if (suppress) return;
      applyToShareJS(cm, change);

      // check to make sure document in sync, update timestampss
      check();
    }

    cm.detachShareJsDoc = function () {
      ctx.removeListener(textInsertListener);
      ctx.removeListener(textDeleteListener);
      cm.off('change', onLocalChange);
    };

    // Convert a CodeMirror change into an op understood by share.js
    function applyToShareJS(cm, change) {

      // CodeMirror changes give a text replacement.

      var startPos = 0;  // Get character position from # of chars in each line.
      var i = 0;         // i goes through all lines.

      while (i < change.from.line) {
        startPos += cm.lineInfo(i).text.length + 1;   // Add 1 for '\n'
        i++;
      }

      startPos += change.from.ch;

      // sharejs json path to the location of the change
      var textPath = ['text', startPos];

      // array of operations that will be submitted
      var ops = [];

      // object to keep track of lines that were deleted
      var deletedLines = {};

      // get an updated document
      var doc = ctx.get();

      if (change.to.line == change.from.line && change.to.ch == change.from.ch) {
        // nothing was removed.
      } else {


        // change in lines (deleted lines)
        if(change.to.line !== change.from.line){
          for (i = change.to.line; i > change.from.line; i--) {

            if(doc.lines[i] !== undefined){
              ops.push({p:['lines', i], ld: doc.lines[i]});
              deletedLines[i] = true;
            }
          }
      }

        // change in text (deletion)
        ops.push({p:textPath, sd: change.removed.join('\n')});


    }

      if (change.text) {

        // change in text (insertion)
        ops.push({p:textPath, si: change.text.join('\n')});

        // new lines and pasting
        if ((change.from.line === change.to.line && change.text.length > 1) || change.origin === 'paste') {

          // figure out if there should also be an included line insertion
          // // if the change was just to add a new line character, do a replace
          // // on that line and then do an insert for the next
          if (change.text.join('\n') === '\n') {
            ops.push({p:['lines', change.from.line+1], li: {
              client: timestamps.client,
              timestamp: new Date ()
            }});
          } else {
            if (change.origin !== 'paste' && change.origin !== 'redo' && change.origin !== 'undo') {
              console.warn('not sure what to do in this case', change);
            } else {

              if (newTimestamp !== doc.lines[change.from.line].timestamp ||
                  timestamps.client !== doc.lines[change.from.line].client) {

                // replace (delete and insert) the line with updated values
                ops.push({p:['lines', change.from.line], ld: doc.lines[change.from.line], li: {
                  client: timestamps.client,
                  timestamp: new Date ()
                }});
              }

              for (i = 1; i < change.text.length; i++) {
                ops.push({p:['lines', change.from.line+1], li: {
                  client: timestamps.client,
                  timestamp: new Date ()
                }});
              }
            }
          }
        } else {
          // change in lines (replace + insertion)
          for (var changeTextIndex = 0; changeTextIndex < change.text.length; changeTextIndex++) {
            var lineChange = change.text[changeTextIndex];
            var lineIndex = change.from.line + changeTextIndex;

            if (doc.lines[lineIndex]) {

              // if this line was just deleted, we don't want to submit any
              // updates for it ... we have already updated the text appropriately,
              // updating this now will update the wrong line.

              var newTimestamp = new Date ();

              // the line metadata has changed (new author or new date)
              if (newTimestamp !== doc.lines[lineIndex].timestamp ||
                  timestamps.client !== doc.lines[lineIndex].client) {

                // replace (delete and insert) the line with updated values

                ops.push({p:['lines', lineIndex], ld: doc.lines[lineIndex], li: {
                  client: timestamps.client,
                  timestamp: newTimestamp
                }});
              }


            } else {
              // the line doesn't currently exist, so insert a new line
              ops.push({p:['lines', lineIndex], li: {
                client: timestamps.client,
                timestamp: new Date ()
              }});
            }
          }
        }
      }

      // submit the complete list of changes
      //console.log(ops);
      ctx.submitOp(ops);

      // call the function again on the next change, if there is one
      if (change.next) {
        applyToShareJS(cm, change.next);
      }
    }

    function check() {
      // magic, no touchy
      setTimeout(function () {
        var cmText = cm.getValue();
        var otDoc = ctx.get();

        if (cmText !== otDoc.text) {
          console.error("Text does not match!");
          console.error("cm: " + cmText);
          console.error("ot: " + otDoc.text);
          // Replace the editor text with the ctx snapshot.
          cm.setValue(ctx.get().text);
        }

        // just draw whatever the server tells us to
        timestamps.lines = otDoc.lines;
        if (!($('#replay-controls-container').is (':visible'))) {
          timestamps.draw (timestamps.lines);
        }
      }, 0);
    }

    return ctx;
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Node.js
    module.exports = shareCodeMirror;
    module.exports.scriptsDir = __dirname;
  } else {
    if (typeof define === 'function' && define.amd) {
      // AMD
      define([], function () {
        return shareCodeMirror;
      });
    } else {
      // Browser, no AMD
      window.sharejs.Doc.prototype.attachCodeMirror = function (cm, ctx, timestamps) {
        if (!ctx) ctx = this.createContext();
        shareCodeMirror(cm, ctx, timestamps);
      };
    }
  }
})();
