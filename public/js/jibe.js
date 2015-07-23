
//
//  jibe.js - Jibe: be in accord; agree.
//
//  - A modern, lightweight, collaborative editing environment.
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

var Replay     = require ('./replay');
var TextFormat = require ('./textformat');
var Timestamps = require ('./timestamps');
var TOC        = require ('./toc');
var Chat       = require ('./chat');


var Jibe = (function (BCSocket, CodeMirror, Replay, showdown, Timestamps, TextFormat, Chat) {

  /*
   *  Returns location string based on URL hash; else default to The Dark Side.
   */
  function getLocation () {
    return location.hash !== '' ? location.hash.substring (1) : 'The Dark Side';
  }

  /*
   *  Reads stored cookie --
   *  -- intended for defining the user via a username cookie.
   */
  function getCookie (name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split (';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) == ' ') {
          cookie = cookie.substring (1, cookie.length);
        }
        if (cookie.indexOf (nameEQ) === 0) {
          return cookie.substring (nameEQ.length, cookie.length);
        }
    }
    return null;
  }

  /*
   *  Sets up the socket and channel for a specific room.
   */
  function setSocket (tool, socket, channel, room) {
    if (tool === 'io') {
      return io (window.location.host + channel);
    } else {
      var share  = new window.sharejs.Connection (new BCSocket (null, { reconnect: true }));
      return share.get (channel, room);
    }
  }

  // Default options to use for CodeMirror instances
  var codeMirrorDefaultOptions = {
    mode         : 'markdown',
    tabMode      : 'indent',
    lineWrapping : true
  };

  /*
   *  Sets up the CodeMirror object (editor) for a specific room.
   */
  function setCodeMirror (options) {
    var opts = $.extend({}, codeMirrorDefaultOptions, options);
    return CodeMirror.fromTextArea (document.getElementById ('entry-markdown'), opts);
  }

  /*
   *  Secondary CodeMirror instance for document replay.
   */
  function setCodeMirrorReplay () {
    var opts = $.extend({}, codeMirrorDefaultOptions, { readOnly : true });
    return CodeMirror.fromTextArea (document.getElementById ('entry-markdown-replay'), opts);
  }

  /*
   *  Instantiates the timestamps handler --
   *  -- leverages timestamps.js.
   */
  function setTimestamps (editor, client) {
    return new Timestamps ({
      client     : client,
      container  : '#timestamps-container',
      codemirror : editor,
      format     : 'YYYY-MM-DD HH:mm'
    });
  }

  /*
   *  Instantiates the text formatting handler --
   *  -- leverages textformat.js.
   */
  function setTextFormat (editor) {
    return new TextFormat ({ codemirror: editor });
  }

  /*
   *  Instantiates the chat handler --
   *  -- leverages chat.js.
   */
  function setChat (components) {
    return new Chat (components);
  }

  /*
   *  Adds the user to the active users container --
   *  -- indicates all users who are currently in the room.
   */
  function setActiveUser (user) {
    var button = $('<button>')
                    .addClass ('btn btn-default')
                    .attr ('data-toggle', 'tooltip')
                    .attr ('data-placement', 'bottom')
                    .attr ('title', user.id)
                    .attr ('id', 'active-user-' + user.id)
                    .html ('<span class="glyphicon glyphicon-user" aria-hidden="true"></span>')
                    .css  ('color', user.color);

    $('#active-users-indicator').append (button);
    $('[data-toggle="tooltip"]').tooltip ({
      container: 'body'
    });
  }

  /*
   *  Removes the user to the active users container --
   *  -- happens on disconect.
   */
  function removeActiveUser (user) {
    $('#active-user-' + user.id).remove ();
  }

  /*
   *  Really not the best way to do things as it includes Markdown formatting along with words --
   *  -- updates the word count located on the editor.
   */
  function updateWordCount (editor) {
    var word_count   = $('.entry-word-count');
    var editor_value = editor.getValue ();

    if (editor_value.length) {
      if (editor_value.match(/\S+/g) === null) {
        word_count.html ('0 words');
      } else {
        word_count.html (editor_value.match(/\S+/g).length + ' words');
      }
    }
  }

  /*
   *  Updates the Jibe preview tab --
   *  -- works in real time (updates while other type).
   */
  function updatePreview (editor, converter) {
    var preview = $('.rendered-markdown');
    //May want to update TOC here too
    toc.generateHeaders(editor);
    preview.html (converter.makeHtml (addSpaces(editor.getValue ())));
    updateWordCount (editor);
  }
  function addSpaces(text){
    var lines = text.split("\n");
    var len = lines.length;
    for (i = 0; i < len; i++ ){
      lines[i] += "  "; // for some reason, you need two spaces after a line to merit a line break
    }
    return lines.join("\n");
  }

  // exposed as Jibe
  var api = {};

  // variables not attached to api can be considered private
  var client    = getCookie ('username') || Math.floor ((Math.random () * 10000000)).toString ();
  var room      = getLocation ();
  var converter = new showdown.Converter ({ extensions: ['xssfilter'] });

  // variables initialized with options in api.initialize()
  var chat,
      editor_bc,     // browser channel socket for CodeMirror / ShareJS
      editor,        // CodeMirror editor instance
      timestamps,
      textformat,
      sharejs_doc,
      replay,
      replay_editor,  // read-only CodeMirror instance for replay
      toc;

  /*
   *  Set up everything - chat socket, CodeMirror, ShareJS, etc.
   */
  api.initialize = function (options) {
    editor_bc  = setSocket ('bc', null, 'jibe', room);
    editor     = setCodeMirror (options);
    timestamps = setTimestamps (editor, client);
    textformat = setTextFormat (editor);
    toc = new TOC();
    replay_editor = setCodeMirrorReplay ();
    sharejs_doc = null;

    /*
     *  Set up chat components.
     */
    var chat_components = {
      'room'   : room,
      'socket' : null,
      'client' : {
        id    : client,
        color : null
      }
    };
    chat_components.socket = setSocket ('io', chat_components.socket, '/chat', chat_components.room);

    /*
     *  Initialize chat.
     */
    chat = setChat (chat_components);
    chat.listen ();

    /*
     *  When first subscribing, this gives us our author information --
     *  -- loads latest chat messages, if any.
     */
    chat.socket.on ('author', function(author) {
      chat.client.color = author.color;
      timestamps.addAuthorColorCoding (author);
      chat.getMoreMessages ();
    });

    /*
     *  Whenever a new client joins, they are added to the local active users array --
     *  -- users currently in the room.
     */
    chat.socket.on ('authorJoined', function (author) {
      timestamps.addAuthorColorCoding (author);
      setActiveUser (author);
    });

    /*
     *  Retrieves every conected client in the room.
     */
    chat.socket.on ('lineAuthors', function (authors) {
      timestamps.processAuthorColorCoding (authors);
    });

    /*
     *  Removes the client that just closed the connection --
     *  -- closed the window, tab, etc.
     */
    chat.socket.on ('authorLeft', function (author) {
      removeActiveUser (author);
    });

    chat.socket.on ('presentAuthors', function (authors) {
      for (var i = 0; i < authors.length; i++) {
        setActiveUser (authors[i]);
      }
    });


    /*
     *  Text formatting within editor --
     *  -- bold, italic, monospace.
     */
    $('#format-bold'  ).click (function () { $(this).blur (); textformat.bold      (); });
    $('#format-code'  ).click (function () { $(this).blur (); textformat.monospace (); });
    $('#format-italic').click (function () { $(this).blur (); textformat.italic    (); });


    /*
     *  Subscribes to BrowserChannel connection and attaches the CodeMirror editor --
     *  -- uses sharejs for all of the OT tasking.
     */
    editor_bc.subscribe ();
    editor_bc.whenReady (function () {
      if (!editor_bc.type) {
        editor_bc.create ('json0');

        var lines = options.defaultText.split('\n');
        var now = new Date();
        for(var i = 0; i < lines.length; i++) {
          lines[i] = {
            client: client,
            timestamp: now
          };
        }

        editor_bc.submitOp({
          p: [], // root path
          od: null, // object delete
          oi: {
            // insert text
            text: options.defaultText.replace('{{room}}', room),
            lines: lines
          }
        });
      }
      if (editor_bc.type && editor_bc.type.name === 'json0') {
        sharejs_doc = editor_bc.attachCodeMirror (editor, null, timestamps);
        editor.refresh();
      }
    });

    /*
     *  Whenever the codemirror editor gets an update, update the markdown preview.
     */
    editor.on('change', function () {
      updatePreview(editor, converter);
    });

    /*
     *  Updates the Preview panel.
     */
    updatePreview (editor, converter);

    /*
     *  Initialize replay capabilities.
     */
    replay = new Replay ({
      chat       : chat,
      client     : client,
      codemirror : replay_editor,
      delay      : 100,
      room       : room,
      old_inst   : editor,
      old_tstamps: timestamps,
      old_toc    : toc,
      timestamps : setTimestamps (replay_editor, client)
    });

    /*
     *  Hides and shows the Timeslider.
     */
    $('#toggle-slider').click (function () {
      $(this).blur ();
      replay.timestamps.colors = timestamps.colors;

      if ($('#replay-controls-container').is (':visible')) {
        if(!replay.stopped){
         replay.stop ();
        }
        $('#play-button').removeClass('glyphicon glyphicon-stop').addClass('glyphicon glyphicon-play');

        $('#replay-controls-container').hide ("fast");

        $('#entry-markdown-replay').next ('.CodeMirror').hide ();
        $('#entry-markdown').next ('.CodeMirror').show ();

        $('div#editor-preview-container').removeClass ('replaying');
        $('#editor-preview-toggle').bootstrapToggle ('enable');
        $('.format').prop("disabled",false);
        $('#flag-version').prop("disabled",false);
        replay.reset();
        $('#flag-left').prop("disabled",true);
        $('#flag-right').prop("disabled",true);

      } else {
        replay.setUp (function () {
          replay.reset ();
          $('#play-button').removeClass('glyphicon glyphicon-play').addClass('glyphicon glyphicon-stop');
          $('#editor-preview-toggle').bootstrapToggle ('disable');
          $('.format').prop("disabled",true);
          $('#flag-version').prop("disabled",true);
          $('#flag-left').prop("disabled",false);
          $('#flag-right').prop("disabled",false);

          $('#start-replay-button').removeClass ('active');
          $('#entry-markdown').next ('.CodeMirror').hide ();
          $('#replay-controls-container').show ("fast");
          $('#entry-markdown-replay').next ('.CodeMirror').show ();
          replay.addFlags();

          $('div#editor-preview-container').addClass ('replaying');

        });
      }
      timestamps.draw(sharejs_doc.get().lines);
      updatePreview(editor,converter);
    });

    /*
     *  Initialize Markdown/Preview toggle switch --
     *  -- requires Bootstrap Toggle module.
     */
    $('#editor-preview-toggle').bootstrapToggle ({
      on  : 'Preview',
      off : 'Editing'
    });

    /*
     *  Detects change on Bootstrap toggle.
     */
    $('#editor-preview-toggle').change(function() {
      if ($(this).prop('checked')) {
        $('#markdown').hide ();

        $('#preview').show ();
        $('#jibe-controls-container button').prop("disabled", true);

      } else {
        $('#preview').hide ();
        $('#markdown').show ();
        $('#jibe-controls-container button').prop("disabled", false);
      }
    });

    /*
     *  When the replay button is clicked, start replaying the operations that have been performed on the document --
     *  -- when it is clicked again, stop replaying, and return to the latest version of the document.
     */
    $('#start-replay-button').click (function(event) {
      $(this).blur ();
      if ($(this).hasClass('active')) {
        replay.stop ();
        replay.stopped = true;
      } else {
        replay.replay();
        replay.stopped = false;
      }

      /*
       *  Toggle the active class on/off on the replay button.
       */

      $(this).toggleClass ('active');
      $(this).find ('span.glyphicon').toggleClass ('glyphicon-pause').toggleClass ('glyphicon-play');
    });

    /*
     *  Flagged version functionality
     */
    $('#flag-version').click (function () {
      $(this).blur();

      // flag current version
      api.flagVersion ();
    });

    /*
    * Hide the left/right flag buttons on startup
    */
    $('#flag-left').prop("disabled",true);
    $('#flag-right').prop("disabled",true);

    /*
    * Implement next-flag prev-flag functionality
    */
    $('#flag-left').click(function(){
      $(this).blur();
      replay.prevFlag();
    });
    $('#flag-right').click(function(){
      $(this).blur();
      replay.nextFlag();
    });


    // Table of Contents stuff
    /* Toggles table of contents panel
    */
    $('#toggle-toc').click(function(){
      if( $('#toc-container').is(":visible")){
        $('#toc-container').hide('slow',function(){
          $('#editor-preview-container').removeClass("col-md-9");
        });

      }
      else{
        $('#toc-container').show("slow");
        $('#editor-preview-container').addClass("col-md-9");
      }
    });

    /*
    * Jump to line functionality for table of contents
    */
    $('#toc-root').on('click','.level',function(event){
        var line_num = parseInt(event.target.dataset.linenum);
        editor.focus();
        editor.setCursor({line:line_num,ch:0});
    });

    /*
    * Jump to last line of editor when clicked, but only when not clicking within text
    */
    $('#editor-preview-container').click(function(){
      if(!editor.hasFocus()){
        editor.focus();
        editor.execCommand("goDocEnd");
      }
    });


  };



  /*
   *  Flag the current version of the document.
   */
  api.flagVersion = function () {
    $.post('ops/' + room + '/flag', function(result) {});
  };

  /*
   *  Retrieve the value for the placeholder option.
   */
  api.getPlaceholder = function () {
    return editor.getOption('placeholder');
  };

  /*
   *  Retrieve the current contents of the document.
   */
  api.getText = function () {
    return editor.doc.getValue();
  };

  /*
   *  Insert the given text at the current cursor position.
   */
  api.insertTextAtCursor = function (text) {
    var cursorPos = editor.doc.getCursor();
    return editor.doc.replaceRange(text, cursorPos, cursorPos);
  };

  /*
   *  Register a keyword replacement.
   *
   *  Any time a user enters '@<keyword>:<key>' and then presses either the
   *  spacebar or the enter key, that text will be replaced using the
   *  provided replacement value.  If a function is provided as the replacement,
   *  it should have the signature 'function (value, callback) {...}', and the
   *  replacement text should be passed to the callback.  This allows for
   *  asynchronous lookups to be used in the replacement function.
   */
  api.registerKeywordReplacement = function (keyword, replacement) {
    editor.registerKeywordReplacement(keyword, replacement);
  };

  /*
   *  Replace the contents of the document between from and to with the given
   *  replacementText.  From and to are objects - {line: <lineNum>, ch: charNum}.
   *
   *  See https://codemirror.net/doc/manual.html#api_content
   */
  api.replaceText = function (replacementText, from, to) {
    return editor.doc.replaceRange(replacementText, from, to);
  };

  /*
   *  Override the value for the placeholder option.
   */
  api.setPlaceholder = function (newPlaceholder) {
    return editor.setOption('placeholder', newPlaceholder);
  };

  /*
   *  Set the current document contents to the given string.
   */
  api.setText = function (newContents) {
    editor.doc.setValue(newContents);
  };

  // exposed as Jibe
  return api;
})(BCSocket, CodeMirror, Replay, showdown, Timestamps, TextFormat, Chat);


/*
 *  Sets up scope and protects the jQuery $ sign --
 *  -- plays nice with other jQuery plugins.
 *
 *  Utilization: $('#bae').jibe () ...
 *  ... you're welcome :-)
 */
(function ($, Jibe) {

  var DEFAULTS = {
    defaultText: "",
    placeholder: "Begin typing here...",
    template: "templates/editor.html",
    keywordReplace: true
  };

  $.fn.jibe = function (opts) {
    var jibe_container = this; // e.g. #jibe-container

    var options = $.extend({}, DEFAULTS, opts);
    /*
     *	Downloads required HTML for firing Jibe into the coolest jibe you'll ever jibe.
     */
    //  $(this).load(this.opts.template, function(){
    //    Jibe.agree();
    //  });
    $.ajax ({
    	url: options.template,
    	type: "GET",
    	success: function (data) {
        // Replaces container div with Jibe HTML
        $(jibe_container).html (data);
        // Jibe!
        Jibe.initialize (options);
      },
      async: false // TODO async templates please
    });
  };
}(jQuery, Jibe));
