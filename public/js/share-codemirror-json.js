(function () {
  'use strict';

  /**
   * @param cm - CodeMirror instance
   * @param ctx - Share context
   */
  function shareCodeMirror(cm, ctx) {
    if (!ctx.provides.json) throw new Error('Cannot attach to non-json document');

    var suppress = false;

    console.log(ctx);

    // TODO fetch from share
    var doc = ctx.get() || {
      text: '',
      lines: []
    };

    cm.setValue(doc.text);
    check();

    ctx.addListener('insert', onInsert);
    ctx.addListener('remove', onRemove);

    var onInsert = function(pos, doc) {
      console.log("onInsert", pos, doc);
      suppress = true;
      cm.replaceRange(doc.text, cm.posFromIndex(pos));
      suppress = false;
      check();
    };

    var onRemove = function (pos, length) {
      console.log("onRemove", pos, length);
      suppress = true;
      var from = cm.posFromIndex(pos);
      var to = cm.posFromIndex(pos + length);
      cm.replaceRange('', from, to);
      suppress = false;
      check();
    };

    cm.on('change', onLocalChange);

    function onLocalChange(cm, change) {
      if (suppress) return;
      applyToShareJS(cm, change);
      check();
    }

    cm.detachShareJsDoc = function () {
      ctx.onRemove = null;
      ctx.onInsert = null;
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

      if (change.to.line == change.from.line && change.to.ch == change.from.ch) {
        // nothing was removed.
      } else {
        // delete.removed contains an array of removed lines as strings, so this adds
        // all the lengths. Later change.removed.length - 1 is added for the \n-chars
        // (-1 because the linebreak on the last line won't get deleted)
        /*var delLen = 0;
        for (var rm = 0; rm < change.removed.length; rm++) {
          delLen += change.removed[rm].length;
        }
        delLen += change.removed.length - 1;
*/
        var deletedText = '';
        for (var rm = 0; rm < change.removed.length; rm++) {
          deletedText += change.removed[rm];
        }
        console.log("change", change);
        console.log("deletedTExt", deletedText);
        //TODO update for json
        ctx.submitOp({p:['text', startPos], sd: deletedText});
        //ctx.remove(startPos, delLen);
      }
      if (change.text) {
        //TODO update for json

        ctx.submitOp({p:['text', startPos], si: change.text.join('\n')});
        //ctx.insert(startPos, change.text.join('\n'));
      }
      if (change.next) {
        applyToShareJS(cm, change.next);
      }
    }


    function check() {
      setTimeout(function () {
        var cmText = cm.getValue();
        var otDoc = ctx.get() || {
          text: '',
          lines: []
        };

        if (cmText !== otDoc.text) {
          console.error("Text does not match!");
          console.error("cm: " + cmText);
          console.error("ot: " + otDoc.text);
          // Replace the editor text with the ctx snapshot.
          cm.setValue(ctx.get().text || '');
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
