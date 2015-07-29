(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

//
//  chat.js
//
//  - Simulated class that handles everything chat-related
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

function Chat (data) {
  this.client          = data.client;
  this.room            = data.room;
  this.count           = 0;
  this.typing          = 0;
  this.socket          = data.socket;
  this.timeout         = {};
  this.allMessages     = false;
  this.fetchInProgress = false;

  /*
   *  NOTICE: this instance object is used throughout the following code --
   *  -- can be considered a hammer. Sorry.
   */
  var instance = this;

  /*
   *  Shows a desktop notification to the user if enabled.
   */
  this.sendNotification = function (message) {
    var title        = "Message from " + message.authorId;
    var options      = { body: message.message };
    var notification = new Notification (title, options);

    /*
     *  Set a timeout of 3 seconds to automatically close the shown desktop notification.
     */
    setTimeout (instance.closeNotification (notification), 3000);
  };

  /*
   *  Closes desktop notification --
   *  -- called after timeout on sendNotification ().
   */
  this.closeNotification = function (notification) {
    return function () {
      notification.close ();
    };
  };

  /*
   *  Adds given message to chat container --
   *  -- can prepend to container as well as append.
   */
  this.addMessage = function (message, prepend) {
    this.count++;

    $("#typing-" + message.authorId).remove ();
    var classes = "chat-message";

    if (message.authorId == instance.client.id) {
      classes += " bubble-mine animated bounceIn";
      chatdiv  = $('<div>').addClass (classes).text (message.message).css ('background-color', instance.client.color);
    } else {
      if (!prepend) {
        instance.sendNotification (message);
      }
      classes += " bubble-other animated bounceIn";
      chatdiv  = $('<div>').addClass (classes).text (message.message).css ('background-color', message.color);
  	}

    /*
     *  Get the chat pane container.
     */
    var chatpane = document.getElementById ('chat-pane');

    /*
     *  Stash the height difference.
     */
    var shouldScroll = Math.abs (chatpane.scrollHeight - ($(chatpane).scrollTop () + $(chatpane).height ()));

    if (prepend) {
      $('#chat-pane').prepend (chatdiv);
    } else {
      $('#chat-pane').append (chatdiv);
    }

    /*
     *  Decide whether to scroll or not.
     */
    shouldScroll = shouldScroll < $(chatdiv).height () * 2 + 20;

    if (shouldScroll) {
      $(chatpane).scrollTop (chatpane.scrollHeight);
    }
  };

  /*
   *  Loads more chat messages from the server, prepending them to the already loaded messages.
   */
  this.getMoreMessages = function (callback) {
    if (!instance.allMessages && !instance.fetchInProgress) {
      fetchInProgress = true;
      $.get ("chat/" + instance.room + "/" + instance.count, function (data) {
        if (data.length < 50) {
          instance.allMessages = true;
        }
        for (var ii = 0; ii < data.length; ii++) {
          instance.addMessage (data[ii], true);
        }
        instance.fetchInProgress = false;
        if (callback) {
          callback ();
        }
      });
    }
  };

  /*
   *  Displays notification for when a specific user is typing.
   */
  this.addTyping = function (data) {
    // $("#typing-" + data.client).remove();
    $("#typing-notify").empty ();

    var typing;

    if (data.value == 1) {
      typing = $('<div>')
        .addClass('typing-notify')
        .attr('id', 'typing-' + data.client)
        .text(data.client + " is typing...");
      $('#typing-notify').html(typing);
    } else if (data.value == 2) {
      typing = $('<div>')
        .addClass('typing-notify')
        .attr('id', 'typing-' + data.client)
        .text(data.client + " has entered text");
      $('#typing-notify').html(typing);
    }
  };

  /*
   *  Removes the typing notification from the container.
   */
  this.clearTyping = function () {
    var value = $('#chat-message').val ();
    if (instance.typing == 1) {
      if (value === "") {
        instance.typing = 0;
      } else {
        instance.typing = 2;
      }

      instance.sendTyping ();
    }
  };

  /*
   *  Send to the server the typing value.
   */
  this.sendTyping = function () {
    instance.socket.emit ('typing', {
      roomId   : instance.room,
      authorId : instance.client.id,
      value    : instance.typing,
    });
  };

  /*
   *  Initializes all listeners for chat.
   */
  this.listen = function () {
    /*
     *  Subscript to room and set up socket listeners.
     */
    instance.socket.emit ('subscribe', {
      roomId: instance.room,
      authorId: instance.client.id
    });
    instance.socket.on ('message', instance.addMessage);
    instance.socket.on ('typing' , instance.addTyping );

    /*
     *  Detects scrolling inside the chat pane --
     *  -- chat bubbles container.
     */
    $('#chat-pane').scroll (function () {
      if ($('#chat-pane').scrollTop () < 250) {
        var old_height   = document.getElementById ('chat-pane').scrollHeight;
        var old_position = $('#chat-pane').scrollTop ();

        instance.getMoreMessages (function () {
          var new_height = document.getElementById ('chat-pane').scrollHeight;
          $('#chat-pane').scrollTop (new_height - old_height + old_position);
        });
      }
    });

    /*
     *  Detects when user has finished typing --
     *  -- when text input is clear or empty.
     */
    $('#chat-message').keyup (function (event) {
    	if ($(this).val () === '') {
        setTimeout (instance.clearTyping, 1000);
    	}
    });

    /*
     *  Used to detect when the user sends a message --
     *  -- hits enter.
     */
    $('#chat-message').keypress (function (event) {
      if (event.keyCode == 13) {
        message = $('#chat-message').val ();
        if (message !== "") {
          message = {
            roomId  : instance.room,
            authorId: instance.client.id,
            message : message,
            timestamp: new Date ()
          };

          instance.socket.emit ('message', message);
          instance.addMessage (message);

          $('#chat-message').val ('');
          setTimeout (instance.clearTyping, 1000);
        }
        return false;
      }
    });

    /*
     *  This doesn't count pasting as typing --
     *  -- not sure why :-S
     */
    $('#chat-message').on('keyup change', function(event) {
      if (event.which !== 13) {
        if (instance.typing !== 1) {
          instance.typing = 1;
          instance.sendTyping ();

          instance.timeout = setTimeout (instance.clearTyping, 2000);
        } else {
          clearTimeout (instance.timeout);
          instance.timeout = setTimeout (instance.clearTyping, 2000);
        }
      }
      clearTimeout (instance.timeout);
    });

    /*
     *  Requests permission to display desktop notifications.
     */
    Notification.requestPermission ();
  };
}

module.exports = Chat;

},{}],2:[function(require,module,exports){

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
    return location.hash !== '' ? location.hash.substring (1) : 'The Jibe Side';
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
      format     : 'HH:mm'
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
  showdown.setOption('strikethrough', true);
  showdown.setOption('tables', 'true');
  var converter = new showdown.Converter ({ extensions: ['xssfilter']});


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

},{"./chat":1,"./replay":3,"./textformat":4,"./timestamps":5,"./toc":6}],3:[function(require,module,exports){

//
//  replay.js
//
//  - View a replay of all operations that have occurred in a room.
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

function Replay (params) {
  this.chat         = params.chat;
  this.client       = params.client;
  this.codemirror   = params.codemirror;
  this.delay        = params.delay;
  this.room         = params.room;
  this.share        = params.share;
  this.timestamps   = params.timestamps;
  this.operations   = [];
  this.snapshot     = {};
  this.time_slider  = null;
  this.current_v    = null;

  /*
  * These are for the realtime adjustment of the table of contents.
  * Also used to recreate editor view without needing a refresh by user
  */
  this.old_toc      = params.old_toc;
  this.old_inst     = params.old_inst;
  this.old_tstamps  = params.old_tstamps;

  //Used to tell the play/pause button when to start/stop
  this.stopped      = false;

  //Used for flagging capabilities
  this.flagged      = [];
  this.current_flag = null;
  this.next_flag    = 0;
  this.prev_flag    = null;
  this.at_flag = false;

  var instance = this;
  var stop = false;

  var flagTemplate = '<div class="flagged-versions" style="left: {{percentLeft}}%">' +
    '<span class="glyphicon glyphicon-flag" aria-hidden="true"></span></div>';

  /*
   *  Sets the everything to .
   */
  this.setUp = function (callback) {
    $.get ('ops/' + this.room, function (operations) {
      if (operations[0] && operations[0].create) {
        instance.current_v  = 0;
        instance.operations = operations;
        instance.snapshot   = operations[0].create.data;
        instance.codemirror.setValue (instance.snapshot.text);

        instance.fireSliderEventHandlers ();
        instance.timestamps.draw (instance.snapshot.lines);

        // makes sure to reset the current/prev/next flag on startup
        this.current_flag = null;
        this.prev_flag = null;
        this.next_flag = 0;

        callback ();
        instance.setVersion(0);
      }
    });

    // click handler for changing replay speed
    $('#speed-buttons-container button').on('click', function(event) {
      $activeButton = $(this);
      $activeButton.blur();
      instance.delay = Number($activeButton.data('delay'));
      $('#speed-buttons-container button').removeClass('active');
      $activeButton.toggleClass('active');
    });
  };

  /*
   *  Add any flagged versions to the replay slider div
   */
  this.addFlags = function() {
    this.flagged = [];
    this.current_flag = null;
    $('#flag-left').prop("disabled",true);
    for (var i = 0; i < instance.operations.length; i++) {
      if (instance.operations[i].flagged) {
        // add this operation to the list of flagged ops
        this.flagged.push(i);

        // add a flag to the appropriate place on the slider
        var percentLeft = (instance.operations[i].v / (instance.operations.length-1) * 100);
        var element = flagTemplate.replace('{{percentLeft}}', percentLeft);
        $('#replaySlider').append (element);
      }
    }
    if (this.flagged.length === 0){
      $('#flag-left').prop("disabled",true);
      $('#flag-right').prop("disabled",true);
    }
  };

  /*
  * Move the slider to the specified version, invoking the slider handler.
  */
  this.setVersion = function (version) {
    instance.time_slider.slider ('setValue', version);
  };

  /*
  * Moves to next flag
  */
  this.nextFlag = function(){
    if (!this.stopped){
      $('#start-replay-button').toggleClass('active');
      $('#start-replay-button').find('span.glyphicon').toggleClass('glyphicon-pause').toggleClass('glyphicon-play');
      this.stop();
    }
    this.at_flag = true;
    this.setVersion(this.flagged[this.next_flag]);
  };

  /*
  * Moves to previous flag
  */
  this.prevFlag = function(){
    if(!this.stopped){
      $('#start-replay-button').toggleClass('active');
      $('#start-replay-button').find('span.glyphicon').toggleClass('glyphicon-pause').toggleClass('glyphicon-play');
      this.stop();
    }
    this.at_flag = true;
    this.setVersion(this.flagged[this.prev_flag]);
  };

  /*
  * Gets the current/prev/next flag based on the position of the slider
  * Iterates through all flags, each time the slider moves, so for a large
  * number of flagged versions, it may have performance issues.
  */
  this.setCurrentFlag = function(){
    var index = 0;
    if (this.current_v < this.flagged[0]){
      this.current_flag = null;
      this.prev_flag = null;
      this.next_flag = 0;
    }
    else if(this.current_v === this.flagged[0]){
      this.current_flag = 0;
      this.prev_flag = null;
      this.next_flag = 1;
    }
    else if(this.current_v > this.flagged[this.flagged.length-1]){
      this.current_flag = this.flagged.length-1;
      this.prev_flag = this.flagged.length-1;
      this.next_flag = null;
    }
    else if(this.current_v === this.flagged[this.flagged.length-1]){
      this.current_flag = this.flagged.length-1;
      this.prev_flag = this.flagged.length-2;
      this.next_flag = null;
    }
    else{
      while(index < this.flagged.length-1){
        if (this.current_v > this.flagged[index] && this.current_v < this.flagged[index+1]){
          this.current_flag = index;
          this.prev_flag = index;
          this.next_flag = index+1;
          break;
        }
        else if(this.current_v === this.flagged[index]){
          this.current_flag = index;
          this.prev_flag = index - 1;
          this.next_flag = index + 1;
          break;
        }
        index++;
      }

    }
    this.checkFlagButtons();
  };

  /*
  * Checks to see if the left/right flag buttons should be disabled. If
  * there are no more flags on either side, disable it.
  */
  this.checkFlagButtons = function(){

    if(this.prev_flag === null || this.flagged.length === 0){
      $('#flag-left').prop("disabled",true);
    }else{
      $('#flag-left').prop("disabled",false);
    }
    if(this.next_flag === null || this.flagged.length === 0){
      $('#flag-right').prop("disabled",true);
    }
    else{
      $('#flag-right').prop("disabled",false);
    }
  };

  this.reset = function () {
    instance.current_v = 0;
    instance.snapshot  = instance.operations[0].create.data;
    instance.time_slider.slider ('setValue', instance.current_v);
    instance.codemirror.setValue (instance.snapshot.text);
    $('#start-replay-button').removeClass ('active');
    $('#start-replay-button').find('span.glyphicon').removeClass ('glyphicon-pause').addClass ('glyphicon-play');
    this.stopped = true;

    // clear flags, since they will need to be redrawn next time
    $('#replaySlider .flagged-versions').remove();
  };

  /*
   *  Instantiates the slider within the controls container.
   */
  this.fireSliderEventHandlers = function () {
    instance.time_slider = $('#replay-slider').slider ({
      min: 0,
      max: instance.operations.length-1,
      value: 0,
      formatter: function (version) {
        /*
         *  This fires whenever the timeslider moves --
         *  -- manually or programatically.
         */
        if (version < instance.current_v) {
          /*
           *  Unbuild the snapshot up to the desired version.
           */
          for (var i = instance.current_v; i > version; i--) {
            if (instance.operations[i].op) {
              instance.snapshot = ottypes.json0.apply (instance.snapshot, ottypes.json0.invert(instance.operations[i].op));
            }
          }
        } else if (version > instance.current_v) {
          /*
           *  Build the snapshot up to the desired version.
           */
          for (var j = instance.current_v + 1; j <= version; j++) {
            if (instance.operations[j].op) {
              instance.snapshot = ottypes.json0.apply (instance.snapshot, instance.operations[j].op);
            }
          }
        }

        instance.codemirror.setValue (instance.snapshot.text);
        instance.timestamps.draw (instance.snapshot.lines);
        instance.old_toc.generateHeaders(instance.codemirror);
        instance.current_v = version;
        instance.setCurrentFlag();
        return 'Version: ' + version;
      }
    });
  };

  /*
   *  Starts document replay.
   */
  this.replay = function () {
    this.stopped = false;
    if (instance.current_v >= instance.operations.length-1) {
      instance.setUp (function () {
        instance.replay ();
      });
    } else {
      instance.slide ();
    }
  };

  /*
   *  Recursively plays through the rest of the operations.
   */
  this.slide = function () {
    // Replay should be stopped if the current version is greater than version length, or if it hits a flag
    if (instance.current_v >= instance.operations.length-1 || (instance.operations[instance.current_v].flagged && !this.at_flag)) {
      this.at_flag = true;
      $('#start-replay-button').toggleClass('active');
      $('#start-replay-button').find('span.glyphicon').toggleClass('glyphicon-pause').toggleClass('glyphicon-play');

      this.stopped = true;
      return;
    } else if (stop) {
      stop = false;
      return;
    }
    this.at_flag = false;
    instance.time_slider.slider ('setValue', instance.current_v + 1);

    setTimeout(function() {
      instance.slide ();
    }, instance.delay);
  };

  this.stop = function() {
    this.stopped = true;
    stop = true;

  };
}

module.exports = Replay;

},{}],4:[function(require,module,exports){

//
//  textformat.js
//
//  - Text formatting in the CodeMirror editor
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

function TextFormat (data) {
  this.codemirror = data.codemirror;

  /*
   *  Replaces current text with the formatted text.
   */
  this.replace = function (replacement) {
    this.codemirror.replaceSelection (replacement);
  };

  /*
   *  Tells the wrapper function to add the bold markdown characters.
   */
  this.bold = function () {
    this.replace (this.wrapper ('**'));
  };

  /*
   *  Tells the wrapper function to add the italic markdown characters.
   */
  this.italic = function () {
    this.replace (this.wrapper ('_'));
  };

  /*
   *  Tells the wrapper function to add the monospace markdown characters.
   */
  this.monospace = function () {
    this.replace (this.mlWrapper ('`', '```'));
  };

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
      }  else {
        // If there's no multiple lines, just deal with the one.
        return this.wrapText (characters)(selection);
      }
    } else {
      var index = this.codemirror.indexFromPos (this.codemirror.getCursor ());
      this.codemirror.replaceSelection (characters + characters);
      this.codemirror.setCursor (this.codemirror.posFromIndex (index + 2));
    }
  };

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
        return regex.exec (selection).slice (1, 4).join ("");//["_fdsa_", "", "fdsa", "", index: 0, input: "_fdsa_"] takes and concatenates entries 1,2,3
      } else {
        return (characters + selection + characters);
      }
    };
  };

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
          return regex.exec (selection).slice (1, 4).join (""); //["_fdsa_", "", "fdsa", "", index: 0, input: "_fdsa_"] takes and concatenates entries 1,2,3
        } else {
          return mlCharacters + "\n" + selection + "\n" + mlCharacters;
        }
      }  else {
        return this.wrapper (characters);
      }
    }
  };

  /*
   *  Ripped out of a StackOverflow thread --
   *  -- http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
   *  (Escapes all the necessary special characters for regex)
   */
  function escapeRegExp (str) {
    return str.replace (/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
}

module.exports = TextFormat;

},{}],5:[function(require,module,exports){

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
  this.lines      = [];
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
    var now = Date.now();

    if(moment(now).year() !== moment(timestamp).year()){
        this.format = "YYYY-MM-DD";
    }
    else if(moment(now).date() !== moment(timestamp).date()){
      this.format = "MM-DD-HH";
    }
    else{
      this.format = "HH:mm";
    }


    return moment (timestamp).format (this.format);
  };

  /*
   *  Attaches color to specific user.
   */
  this.addAuthorColorCoding = function (author) {
    if (!(author.id in this.colors)) {
      this.colors[author.id] = author.color;
    }
  };

  /*
   *  Populates colors array with all users in room.
   */
  this.processAuthorColorCoding = function (authors) {
    for (var i = 0; i < authors.length; i++) {
      this.addAuthorColorCoding (authors[i]);
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

      if (line.text.replace(/\s+/g, '') !== '') {
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
    }

    $(this.container).html (content);
    this.activateTooltips ();
  };

  /*
   *  Draws the timestamps into its given container.
   */
  this.activateTooltips = function () {
    $('.timestamp')
      .mouseenter (function () {
        $(this).attr ('data-toggle', 'tooltip')
               .attr ('data-placement', 'top')
               .attr ('title', $(this).data ('author'));

       $('[data-toggle="tooltip"]').tooltip ({
         container: 'body'
       });
      })
      .mouseleave (function () {
        $(this).removeAttr ('data-toggle')
               .removeAttr ('data-placement')
               .removeAttr ('title');
      });
  };
}

module.exports = Timestamps;

},{}],6:[function(require,module,exports){
//
//  toc.js
//
//  - Manages the table of contents
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

function TOC(){

  this.editor = null;
  this.editorText = null;
  this.rootId = "toc-root";
  this.level = 0;
  this.lines = [];
  this.heads = [];
  this.lvlReg = /^(#{1,6})/;

  /*
  *  Parses each line and checks to see if the line is a header. If it is a header,
  *  it checks to see what level
  */
  this.parse = function(){
    this.lines = this.editorText.split('\n');
    //Generate regexp for different header levels
    var header = {};
    var len = this.lines.length;

    for (i = 0; i<len; i++){
      var match = this.lines[i].match(this.lvlReg);
      if (match !== null){
        var hlen = match[1].length;
        header = {};
        header.level = hlen;
        header.lineNum = i;
        header.hText = this.lines[i].substring(hlen,this.lines[i].length);
        header.idStr = "toc"+header.lineNum;
        this.heads.push(header);

      }
      }
    };
  /*
  * This generates a header by appending a list to the root container with
  *
  */
    this.generateHeaders = function(editor){
      // empty out the toc  (crazy what kinds of stuff you can get away with)
      $('#toc-root').empty();
      this.setEditor(editor);
      this.parse();
      var len = this.heads.length;
      for(i = 0;i<len;i++){
        if (this.heads[i].hText.length > 0){
          //keeping the nested list in case we want to add expanding and contracting functionality later
          $('#toc-root').append('<ul style = "list-style-type:none" class = "lvl" ><li><a  class = "list-group-item level level'+this.heads[i].level+'" data-linenum="'+this.heads[i].lineNum+'" id = "'+this.heads[i].idStr+'">'+this.heads[i].hText+'</a></li></ul>');
        }
      }
      this.heads = [];
    };

    this.setEditor = function(editor){
      this.editor = editor;
      this.editorText = editor.getValue();
    };
  }

module.exports = TOC;

},{}]},{},[2]);
