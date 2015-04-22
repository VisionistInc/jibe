// big thank you to share-codemirror
// this is as much as possible copied from there

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

      // get an updated document
      var doc = ctx.get();

      if (change.to.line == change.from.line && change.to.ch == change.from.ch) {
        // nothing was removed.
      } else {

        // delete.removed contains an array of removed lines as strings, so this adds
        // all the lengths. Later change.removed.length - 1 is added for the \n-chars
        // (-1 because the linebreak on the last line won't get deleted)
        var delLen = 0;
        for (var rm = 0; rm < change.removed.length; rm++) {
          delLen += change.removed[rm].length;
        }
        delLen += change.removed.length - 1;

        // this is the changed text
        //change.removed.join('\n')

        for (i = change.to.line; i > change.from.line; i--) {
          ops.push({p:['lines', i], ld: doc.lines[i]});
        }

        ops.push({p:textPath, sd: change.removed.join('\n')});

        // submit all of these with the insertions later
        //ctx.remove(textPath, delLen, function(error, appliedOp) {
          //console.info('delete callback', error, appliedOp);
        //});
      }

      if (change.text) {

        // insert op
        ops.push({p:textPath, si: change.text.join('\n')});

        // update timestamps
        for (i = change.from.line; i <= change.to.line; i++) {
          if (doc.lines[i]) {

            var newTimestamp = timestamps.newDate();

            if (newTimestamp !== doc.lines[i].timestamp ||
                timestamps.client !== doc.lines[i].client) {

                // replace (delete and insert) the line with updated values
                ops.push({p:['lines', i], ld: doc.lines[i], li: {
                  client: timestamps.client,
                  timestamp: timestamps.newDate()
                }});
            }

            // figure out if there should also be an included line insertion
            // // if the change was just to add a new line character, do a replace
            // // on that line and then do an insert for the next
            if (change.text.join('\n') === '\n') {
              ops.push({p:['lines', i+1], li: {
                client: timestamps.client,
                timestamp: timestamps.newDate()
              }});
            }

          } else {
            // insert a new line
            ops.push({p:['lines', i], li: {
              client: timestamps.client,
              timestamp: timestamps.newDate()
            }});
          }
        }

        // use this os that we can submit an array of ops that includes
        // both the changes to the text and to the line information
        //ctx.submitOp(ops);

        //ctx.insert(textPath, change.text.join('\n'));
      }

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
        timestamps.draw(otDoc.lines);
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
