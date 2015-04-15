
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

var Jibe = (function (BCSocket, CodeMirror, Showdown, Timestamps, TextFormat, Chat) {

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
        if (cookie.indexOf (nameEQ) == 0) {
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
      return io (window.location.host + channel, function () {
      	socket.emit ('subscribe', room);
      });
    } else {
      var socket = new BCSocket (null, { reconnect: true });
      var share  = new window.sharejs.Connection (socket);
      return share.get (channel, room);
    }
  }

  /*
   *  Sets up the CodeMirror object (editor) for a specific room.
   */
  function setCodeMirror () {
    return CodeMirror.fromTextArea (document.getElementById ('entry-markdown'), {
      mode         : 'markdown',
      tabMode      : 'indent',
      lineWrapping : true,
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
      format     : 'YYYY-MM-DD HH:MI:SS'
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
    agree : function (string) {
      var client     = getCookie ('username') || Math.floor ((Math.random () * 10000000)).toString ();
      var room       = getLocation ();
      var stamps_io  = setSocket ('io', stamps_io, '/stamps', room);
      var editor_io  = setSocket ('io', editor_io, '/editor', room);
      var editor_bc  = setSocket ('bc', null, 'jibe', room);
      var editor     = setCodeMirror ();
      var converter  = new Showdown.converter ();
      var timestamps = setTimestamps (editor, client);
      var textformat = setTextFormat (editor);

      /*
       *  Set up chat components and fire chat --
       *  -- updates timestamps.
       */
      var chat_components = {
        'client' : client,
        'room'   : room,
        'socket' : null
      }
      chat_components.socket = setSocket ('io', chat_components.socket, '/chat', chat_components.room);
      var chat = setChat (chat_components);
      chat.listen ();

      $('#format-bold'  ).click (function () { textformat.bold      (); });
			$('#format-code'  ).click (function () { textformat.monospace (); });
			$('#format-italic').click (function () { textformat.italic    (); });

      /*
       *  Subscribes to BrowserChannel connection and attaches CodeMirror editor --
       *  -- using sharejs for all of the OT tasking.
       */
      editor_bc.subscribe ();
      editor_bc.whenReady (function () {
        if (!editor_bc.type) editor_bc.create ('text');
      	if (editor_bc.type && editor_bc.type.name === 'text') {
          editor_bc.attachCodeMirror (editor);
        }
      });

      /*
       *  Fires whenever the editor changes --
       *  -- updates timestamps.
       */
      editor.on ("change", function (event) {
        timestamps.draw ();
        updatePreview (editor, converter);
      });

      /*
       * Subscribe to editor change events.
       */
      editor_io.emit('subscribe', room);

      /*
       *  Fires whenever the user finished typing a characters --
       *  -- sends current line and author to server to timestamp author color coding.
       */
      editor.on ('keyup', function (event) {
        var cursor = editor.getCursor ();
        if (editor.getLine (cursor.line) !== '') {
          editor_io.emit ('change', {
            pad_id : room,
            client : client,
            line   : cursor.line
          });
        }
      });

      editor_io.on ('change', function(data) {
        console.log (data);
      });

      /*
       *  Updates the Preview panel.
       */
      updatePreview (editor, converter);
    }
  }
})(BCSocket, CodeMirror, Showdown, Timestamps, TextFormat, Chat);

/*
 *  Sets up scope and protects the jQuery $ sign --
 *  -- plays nice with other jQuery plugins.
 *
 *  Utilization: $('div').jibe () ...
 *  ... you're welcome :-)
 */
(function ($, Jibe) {
  $.fn.jibe = function () {
    var jibe_container = this; // e.g. #jibe-container
    /*
     *	Downloads required HTML for firing Jibe into the coolest jibe you'll ever jibe.
     */
    $.ajax ({
    	url: "templates/editor.html",
    	type: "GET",
    	success: function (data) {
        // Replaces container div with Jibe HTML
        $(jibe_container).html (data);
        // Jibe!
        Jibe.agree ();
      },
      async: false
    });
  };
}(jQuery, Jibe));
