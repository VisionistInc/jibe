

/*
 *	Download the HTML from the server 
 */
$.ajax ({
	url: "/templates/editor.html",
	type: "GET",
	success: function (data) {
		$("#codemirror-editor").html (data);
	},
	async: false
});





window.editor = {};
window.pad_id = location.hash !== '' ? location.hash.substring(1) : 'The Dark Side';

window.stamps = io (window.location.host + '/stamps', function () {
	window.stamps.emit ('subscribe', pad_id);
});


window.chatCount = 0;
window.is_typing = false;
window.chat = io (window.location.host + '/chat', function() {
	window.chat.emit('subscribe', window.pad_id)
});




function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

//TODO, let users pick their nicknames or get it from a cookie or something.

var clientID = readCookie('username') || Math.floor((Math.random() * 10000000)).toString();








function Jibe () {
	if (document.getElementById ('entry-markdown')) {
		this.converter = new Showdown.converter ();




	} else {
		return;
	}
}





////////////////////////

		getMoreMessages();

		// if (!document.getElementById('entry-markdown'))
		// 	return;

		//var delay;
		var converter = new Showdown.converter();
		window.editor = CodeMirror.fromTextArea(document.getElementById('entry-markdown'), {
			mode: 'markdown',
			tabMode: 'indent',
			lineWrapping: true
		});

		// Really not the best way to do things as it includes Markdown formatting along with words
		function updateWordCount() {
			var wordCount = document.getElementsByClassName('entry-word-count')[0],
				editorValue = window.editor.getValue();

			if (editorValue.length) {
				if (editorValue.match(/\S+/g) === null) {
					wordCount.innerHTML = '0 words';
				} else {
					wordCount.innerHTML = editorValue.match(/\S+/g).length + ' words';
				}
			}
		}

		function updatePreview() {
			var preview = document.getElementsByClassName('rendered-markdown')[0];
			preview.innerHTML = converter.makeHtml(window.editor.getValue());
			updateWordCount();
		}

		/*********************************************************************/
		/**** Modulate: ******************************************************/

		$(document).ready(function() {
			$('.entry-markdown header, .entry-preview header').click(function(e) {
				$('.entry-markdown, .entry-preview').removeClass('active');
				$(e.target).closest('section').addClass('active');
			});

			/*
			 *	Sets up the CodeMirror editor for text formatting
			 */
			var format = new TextFormat ({ codemirror: window.editor });
			$('#format-bold'  ).click (function () { format.bold ();      });
			$('#format-code'  ).click (function () { format.monospace (); });
			$('#format-italic').click (function () { format.italic ();    });

			/*
			 *	Sets up timestamps to work alonside the CodeMirror editor
			 */
			var timestamps = new Timestamps ({
				container  : '#timestamps-container',
				codemirror : window.editor,
				format     : 'YYYY-MM-DD HH:MI:SS'
			});

			/*
			 *	Fires after every character is finished being typed
			 */
			window.editor.on ('keyup', function (event) {
				var cursor = window.editor.getCursor ();
				if (window.editor.getLine (cursor.line) !== '') {
					window.chat.emit ('active', {
						pad_id : window.pad_id,
						client : clientID,
						line   : cursor.line
					});
				}
			});

			/*
			 *	Fires whenever the editor is being modified.
			 */
			window.editor.on ("change", function (event) {
				timestamps.draw ();
				checkKeywords ();
				updatePreview ();
			});

			updatePreview();
		});

		/*********************************************************************/
		/*********************************************************************/

/////////////////




/*
 * Opens socket, establishes connection to pad based on url location hash
 */
var socket = new BCSocket (null, { reconnect: true });
var share  = new window.sharejs.Connection (socket);
var pad    = share.get ('users', window.pad_id);

pad.subscribe ();

pad.whenReady (function () {
  	if (!pad.type) pad.create ('text');
	if (pad.type && pad.type.name === 'text') {
		pad.attachCodeMirror (window.editor);
  	}
});

/*
 * Chat functionality
 */
function sendChatNotification(message) {
	title   = "Message from " + message.client;
	options = {body: message.message}
	var notification = new Notification(title, options);
	setTimeout(closeNotification(notification), 5000);
}
function closeNotification(notification) {
	return function () {
		notification.close();
	}
}

$(function() { Notification.requestPermission(); });


function addMessage(message, prepend) {
	window.chatCount++;
	$("#typing-" + message.client).remove();
	var classes = "chat-message";

	if (message.client == clientID) {
		classes += " bubble-mine animated bounceIn";
		chatdiv = $('<div>').addClass(classes).text(message.message);

	} else {
		if (!prepend) {
			sendChatNotification(message);
		}
		classes += " bubble-other animated bounceIn";
		chatdiv = $('<div>').addClass(classes).text(message.message).css('background-color', message.color);
	}

	var chatpane = document.getElementById('chat-pane');

	//stash the height difference
	var shouldScroll = Math.abs(chatpane.scrollHeight - ($(chatpane).scrollTop() + $(chatpane).height()));

	if (prepend) {
		$('#chat-pane').prepend(chatdiv);
	} else {
		$('#chat-pane').append(chatdiv);
	}

	//decide whether to scroll or not.
	shouldScroll = shouldScroll < $(chatdiv).height() * 2 + 20

	if(shouldScroll) {
    	$(chatpane).scrollTop(chatpane.scrollHeight);
  	}
}

var allMessages = false;
var fetchInProgress = false;

//load more chat messages from the server, prepending them to the chat messages.
function getMoreMessages(callback) {
	if (!allMessages && !fetchInProgress) {
		fetchInProgress = true;
		$.get("/chat/" + pad_id + "/" + chatCount, function(data) {
			if (data.length < 50) {
				allMessages = true;
			}
			for (var ii = 0; ii < data.length; ii++) {
				addMessage(data[ii]._source, true);
			}
			fetchInProgress = false;
			if (callback) callback();
		});
	}
}

$('#chat-pane').scroll(function() {
	if ($('#chat-pane').scrollTop() < 250) {
		var oldHeight = document.getElementById('chat-pane').scrollHeight;
		var oldPos    = $('#chat-pane').scrollTop();
		getMoreMessages(function() {
			var newHeight = document.getElementById('chat-pane').scrollHeight;
			$('#chat-pane').scrollTop(newHeight - oldHeight + oldPos);
		});
	}
});

function addTyping(data) {
	// $("#typing-" + data.client).remove();
	$("#typing-notify").empty();

	if (data.value == 1) {
		var typing = $('<div>').addClass('typing-notify').attr('id', 'typing-' + data.client).text(data.client + " is typing...");
		$('#typing-notify').html(typing);
	} else if (data.value == 2) { var typing = $('<div>').addClass('typing-notify').attr('id', 'typing-' + data.client).text(data.client + " has entered text");
		$('#typing-notify').html(typing);
	}
}

var chat = io(window.location.host + '/chat', function() {
	chat.emit('subscribe', window.pad_id)
});

window.chat.emit ('subscribe', window.pad_id);
window.chat.on   ('message'  , addMessage);
window.chat.on   ('typing'   , addTyping);

var typing  = 0;
var timeout = {};

function clearTyping () {
	if (typing == 1) {
		if ($('#chat-message').val () === "") {
			typing = 0;
		} else {
			typing = 2;
		}
		sendTyping();
	}
}

function sendTyping () {
	window.chat.emit ('typing', {
		pad_id : window.pad_id,
		client : clientID,
		value  : typing,
	});
}

$('#chat-message').keyup (function (event) {
	if ($(this).val () === '') {
		setTimeout(clearTyping, 1000);
	}
});

$('#chat-message').keypress (function (event) {
  if (event.keyCode == 13) {
		message = $('#chat-message').val();
		if (message !== "") {
			message = {
				pad_id  : window.pad_id,
				client  : clientID,
				message : message,
        timestamp: new Date()
			};

			window.chat.emit ('message', message);
			addMessage (message);

			$('#chat-message').val ('');
			setTimeout(clearTyping, 1000);
		}
		return false;
	}
});

//This doesn't count pasting as typing. Not sure why.
$('#chat-message').on('keyup change', function(event) {
	if (event.which != 13) {
		if (typing != 1) {
			typing = 1;
			sendTyping();
			timeout = setTimeout(clearTyping, 2000);
		} else {
			clearTimeout(timeout);
			timeout = setTimeout(clearTyping, 2000);
		}
	}
	clearTimeout(timeout);
});


//Various stuff for @keywords

//regex for matching the keywords.
var kwRegex = /@([^\s:]+)[ ]?:[ ]?([^\s]+)\s/
var kwRegexEOL = /@([^\s:]+)[ ]?:[ ]?([^\s]+)$/

//TODO - hook this up to whatever system you're pulling data out of.
//Edit this function to pull data from whatever you want. It must return a string.

//TODO make it not replace the string if this returns false.
function lookupValue(type, key) {
	return "//TODO - hook this up to CNOMM";
}

//Check keywords. Run after every keystroke.
function checkKeywords() {
	cursor = editor.getCursor();
	var line = window.editor.getLine(cursor.line);

	//if the regex matches, we go about replacing it.
	if (kwRegex.test(line)) {
		match = kwRegex.exec(line);

		//this is a crude hack that makes share.js not freak out when code is
		//inserted. I don't know why I have to do this, but when I don't, bad things
		//happen.
		setTimeout(function() {
			editor.replaceRange(lookupValue(match[1], match[2]),
					{line: cursor.line, ch: match.index}, cursor);
		}, 0);

		//if it doesn't match the first one, maybe it matches the second?
	} else {
		//work on the previous line becase enter was probably just pressed.
		line = window.editor.getLine(cursor.line -1);
		if (kwRegexEOL.test(line)) {
			match = kwRegexEOL.exec(line);
			//see note about crude hack above.
			setTimeout(function() {
				editor.replaceRange(lookupValue(match[1], match[2]),
						{ line: cursor.line - 1, ch: match.index}, cursor);
				}, 0);
		}
	}
}

/*
 *	Taken out because chat bubble colors would get mixed up
 */
// Will remove the user from server on disconnect
// window.addEventListener("beforeunload", function (e) {
// 	chat.emit ('disconnect', {
// 		client : clientID,
// 		pad_id : pad_id
// 	});
// });
