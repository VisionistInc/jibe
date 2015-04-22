// big thank you to share-codemirror
// this is as much as possible copied from there

(function () {
  'use strict';

  /**
   * @param cm - CodeMirror instance
   * @param ctx - Share context
   */
  function shareCodeMirror(cm, ctx) {
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

      //TODO incorporate timestamp changes

      startPos += change.from.ch;

      // sharejs json path to the location of the change
      var path = ['text', startPos];

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

        ctx.remove(path, delLen, function(error, appliedOp) {
          //console.info('delete callback', error, appliedOp);
        });
      }

      if (change.text) {
        
        ctx.insert(path, change.text.join('\n'), function(error, appliedOp) {
          //console.info('insert callback', error, appliedOp);
        });
      }

      // call the function again on the next change, if there is one
      if (change.next) {
        applyToShareJS(cm, change.next);
      }
    }

    // TODO some infinite loop issue happening here
    function check() {
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
      window.sharejs.Doc.prototype.attachCodeMirror = function (cm, ctx) {
        if (!ctx) ctx = this.createContext();
        shareCodeMirror(cm, ctx);
      };
    }
  }
})();
