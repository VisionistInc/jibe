
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
    var userDiv;

    if (message.authorId == instance.client.id) {
      classes += " bubble-mine animated bounceIn";
      // userClasses = "chat-user bubble-mine animated bounceIn"
      chatdiv  = $('<div>').addClass (classes).text (message.message).css ('background-color', instance.client.color);
      // userDiv = $('<div>').addClass(userClasses).text(message.authorId);
    } else {
      if (!prepend) {
        instance.sendNotification (message);
      }
      classes += " bubble-other animated bounceIn";
      userClasses = "chat-user bubble-other animated bounceIn"
      chatdiv  = $('<div>').addClass (classes).text (message.message).css ('background-color', message.color);
      userDiv = $('<div>').addClass(userClasses).text(message.authorId);
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
      if(typeof userDiv !== "undefined"){
         $('#chat-pane').prepend(userDiv);
       }
      $('#chat-pane').prepend (chatdiv);

    } else {

      $('#chat-pane').append (chatdiv);

      if(typeof userDiv !== "undefined"){
        $('#chat-pane').append(userDiv);
       }
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
