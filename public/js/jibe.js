
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

var Jibe = (function (BCSocket, CodeMirror, Replay, Showdown, Timestamps, TextFormat, Chat) {

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

  /*
   *  Sets up the CodeMirror object (editor) for a specific room.
   */
  function setCodeMirror (placeholderText) {
    return CodeMirror.fromTextArea (document.getElementById ('entry-markdown'), {
      mode         : 'markdown',
      tabMode      : 'indent',
      lineWrapping : true,
      placeholder  : placeholderText
    });
  }

  /*
   *  Secondary CodeMirror instance for document replay.
   */
  function setCodeMirrorReplay () {
    return CodeMirror.fromTextArea (document.getElementById ('entry-markdown-replay'), {
      mode         : 'markdown',
      tabMode      : 'indent',
      lineWrapping : true,
      readOnly     : true
    });
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
                    .attr ('data-placement', 'top')
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
    preview.html (converter.makeHtml (editor.getValue ()));
    updateWordCount (editor);
  }

  return {
    agree : function (options) {
      var client     = getCookie ('username') || Math.floor ((Math.random () * 10000000)).toString ();
      var room       = getLocation ();
      var editor_bc  = setSocket ('bc', null, 'jibe', room);
      var editor     = setCodeMirror (options.placeholder);
      var converter  = new Showdown.converter ();
      var timestamps = setTimestamps (editor, client);
      var textformat = setTextFormat (editor);

      var replay;  // set up after everything else is initialized
      var replay_editor = setCodeMirrorReplay ();

      /*
       *  Used to create the diff sent to server.
       */
      var prior = [];
      var after = [];
      var diff  = null;
      var send  = false;

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
      var chat = setChat (chat_components);
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
          editor_bc.attachCodeMirror (editor, null, timestamps);
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
        timestamps : setTimestamps (replay_editor, client)
      });

      $('#toggle-slider').click (function () {
        $(this).blur ();
        replay.timestamps.colors = timestamps.colors;

        if ($('#replay-controls-container').is (':visible')) {
          $('#replay-controls-container').hide ("fast");
          $('#entry-markdown-replay').next ('.CodeMirror').hide ();
          $('#entry-markdown').next ('.CodeMirror').show ();
          replay.reset ();
          timestamps.draw (timestamps.lines);
        } else {
          replay.setUp (function () {
            $('#entry-markdown').next ('.CodeMirror').hide ();
            $('#replay-controls-container').show ("fast");
            $('#entry-markdown-replay').next ('.CodeMirror').show ();
            replay.addFlags();
          });
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
        } else {
          replay.replay();
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
        $.post('ops/' + room + '/flag', function(result) {
          console.log('flagged version', result);
        });
      });
    }
  };
})(BCSocket, CodeMirror, Replay, Showdown, Timestamps, TextFormat, Chat);


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
        Jibe.agree (options);
      },
      async: false // TODO async templates please
    });
  };
}(jQuery, Jibe));
