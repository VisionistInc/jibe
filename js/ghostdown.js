
window.editor = {};
window.lines  = [];
window.pad_id = location.hash !== '' ? location.hash : 'The Dark Side';
window.stamps = io (window.location.host + '/stamps', function () {
	window.stamps.emit ('subscribe', pad_id);
});
window.chatCount = 0;

//TODO, let users pick their nicknames or get it from a cookie or something.
var clientID = Math.floor((Math.random() * 10000000)).toString();

(function($, ShowDown, CodeMirror) {
	"use strict";

	$(function() {

		if (!document.getElementById('entry-markdown'))
			return;

		//var delay;
		var converter = new ShowDown.converter();
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

		function updateImagePlaceholders(content) {
			var imgPlaceholders = $(document.getElementsByClassName('rendered-markdown')[0]).find('p').filter(function() {
				return (/^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(?:\(([^\n\]]*)\))?$/gim).test($(this).text());
			});

			$(imgPlaceholders).each(function( index ) {

				var elemindex = index,
					self = $(this),
					altText = self.text();

				(function(){

					self.dropzone({
						url: "/article/imgupload",
						success: function( file, response ){
							var holderP = $(file.previewElement).closest("p"),

								// Update the image path in markdown
								imgHolderMardown = $(".CodeMirror-code").find('pre').filter(function() {
							    	return (/^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(?:\(([^\n\]]*)\))?$/gim).test(self.text()) && (self.find("span").length === 0);
								}),

								// Get markdown
								editorOrigVal = window.editor.getValue(),
								nth = 0,
								newMarkdown = editorOrigVal.replace(/^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(:\(([^\n\]]*)\))?$/gim, function (match, i, original){
									nth++;
									return (nth === (elemindex+1)) ? (match + "(" + response.path +")") : match;
								});
								window.editor.setValue( newMarkdown );

							// Set image instead of placeholder
							holderP.removeClass("dropzone").html('<img src="'+ response.path +'"/>');
						}
					}).addClass("dropzone");
				}());
			})
		}

		function updatePreview() {
			var preview = document.getElementsByClassName('rendered-markdown')[0];
			preview.innerHTML = converter.makeHtml(window.editor.getValue());

			updateImagePlaceholders(preview.innerHTML);
			updateWordCount();
		}

		$(document).ready(function() {
			$('.entry-markdown header, .entry-preview header').click(function(e) {
				$('.entry-markdown, .entry-preview').removeClass('active');
				$(e.target).closest('section').addClass('active');
			});

			window.editor.on ("change", function (event) {
				var cursor = window.editor.getCursor ();
				var date_format = 'YYYY-MM-DD HH:MI:SS';

				var searchForTimestamp = function (text) {
					if (window.lines.length > 0) {
						for (var i = 0; i < window.lines.length; i++) {
							if (window.lines[i].text === text) {
								return window.lines[i].timestamp;
							}
						}
					}
					return new Date ().toFormat (date_format);
				}

				var getTimestamp = function (text) {
					if (text === '' || typeof text === 'undefined') {
						return null;
					} else {
						return searchForTimestamp (text);
					}
				}

				var sendToServer = function () {
					window.stamps.emit ('stamps', {
						pad_id    : window.pad_id,
						lines     : window.lines,
						timestamp : new Date ().toFormat (date_format)
					});
				}

				var drawTimestamps = function (lines) {
					var content = '';

					for (var i = 0; i < lines.length; i++) {
						if (lines[i].text === '') {
							content += '<div class="blank-div" style="height: ' + lines[i].height + 'px;"></div>';
						} else {
							content += '<div class="timestamp" style="height: ' + lines[i].height + 'px;" data-author="' + lines[i].author + '">';
							content += '<p>' + lines[i].timestamp + '</p>';
							content += '</div>';
						}
					}

					$("#timestamps-container").html (content);
					window.lines = lines;


					window.stamps.emit ('stamps', window.lines);
				}

				var temp_array = [];
				var lines = [];
				for (var i = 0; i < window.editor.doc.children.length; i++) {
					for (var j = 0; j < window.editor.doc.children[i].lines.length; j++) {
						lines.push (window.editor.doc.children[i].lines[j])
					}
				}

				for (var i = 0; i < lines.length; i++) {
					var line = lines[i];
					var object = {
						line : i,
						height: line.height,
						text : line.text,
						timestamp : getTimestamp (line.text),
						author : clientID
					}

					if (cursor.line === i) {
						object.timestamp = new Date ().toFormat (date_format);
					}

					temp_array.push (object);
				}

				drawTimestamps (temp_array);
				updatePreview();

				$('.timestamp').hover (
					function () {
						console.info ($(this).data ("author"));
					}, function () {
						console.info ("Left...");
					}
				);

				//check for @keywords.
				checkKeywords();
			});

			updatePreview();

			// Sync scrolling
			function syncScroll(e) {
				// vars
				var $codeViewport = $(e.target),
					$previewViewport = $('.entry-preview-content'),
					$codeContent = $('.CodeMirror-sizer'),
					$previewContent = $('.rendered-markdown'),

					// calc position
					codeHeight = $codeContent.height() - $codeViewport.height(),
					previewHeight = $previewContent.height() - $previewViewport.height(),
					ratio = previewHeight / codeHeight,
					previewPostition = $codeViewport.scrollTop() * ratio;

				// apply new scroll
				$previewViewport.scrollTop(previewPostition);
			}

			// TODO: Debounce
			$('.CodeMirror-scroll').on('scroll', syncScroll);

			// Shadow on Markdown if scrolled
			$('.CodeMirror-scroll').scroll(function() {
				if ($('.CodeMirror-scroll').scrollTop() > 10) {
					$('.entry-markdown').addClass('scrolling');
				} else {
					$('.entry-markdown').removeClass('scrolling');
				}
			});
			// Shadow on Preview if scrolled
			$('.entry-preview-content').scroll(function() {
				if ($('.entry-preview-content').scrollTop() > 10) {
					$('.entry-preview').addClass('scrolling');
				} else {
					$('.entry-preview').removeClass('scrolling');
				}
			});

			window.editor.focus ();

		});
	});
}(jQuery, Showdown, CodeMirror));


$('#format-bold').click (function () {
	Format.bold ();
});

$('#format-italic').click (function () {
	Format.italic ();
});

$('#format-code').click (function () {
	Format.code ();
});


//
// Takes care of text formatting via the use of the button toolbar located on the page
//
var Format = Format || {};

Format.replace = function (replacement) {
	position_cursor = typeof position_cursor === "undefined" ? false : true;
	window.editor.replaceSelection (replacement);
}

Format.bold = function () {
	Format.replace (Format.wrapper ('**'));
}

Format.italic = function () {
	Format.replace (Format.wrapper ('_'));
}

Format.code = function () {
	Format.replace (Format.mlWrapper ('`', '```'));
}

/*
 * wraps the selection in the characters specified.
 * also handles the multi-line case, wrapping each individual line in said
 * characters.
 */
Format.wrapper = function (characters) {
	if (window.editor.somethingSelected ()) {
		var selection = window.editor.getSelection ('\n');

		//wrap lines individually.
		if (/\n/.test(selection)) {
			return selection.split("\n").map(Format.wrapText(characters)).join("\n");
		}

		//if there's not multiple lines, just deal with the one.
		else {
			return Format.wrapText(characters)(selection);
		}
	}
	else {
		var index = window.editor.indexFromPos (window.editor.getCursor ());
		window.editor.replaceSelection (characters + characters);
		window.editor.setCursor (window.editor.posFromIndex (index + 2));
	}
}

/*
 * Returns a function that wraps the text in the characters specified.
 */
Format.wrapText = function (characters) {
	return function (selection) {
		if (/^\s*$/.test(selection)) {
			return selection;
		}
		//Regex that picks apart the different pieces of the format.
		var re = new RegExp("(.*)" + escapeRegExp(characters) + "(.*)" +
				escapeRegExp(characters) + "(.*)");
		//test if the format is already applied:
		if (re.test(selection)) {
			return re.exec(selection).slice(1, 4).join("");
		} else {
			return (characters + selection + characters);
		}
	}
}


/*
 * Multiline wrapper. Inserts mlCharacters on new lines at beginning and end of
 * the selection, or just characters at the beginnign and end of the line if
 * only one line is selected.
 */
Format.mlWrapper = function (characters, mlCharacters) {
	if (window.editor.somethingSelected()) {
		var selection = window.editor.getSelection('\n');
		if (/\n/.test(selection)) {
			var re = new RegExp("([\\s\\S]*)" + escapeRegExp(mlCharacters) + "\\n([\\s\\S]*)\\n" +
				escapeRegExp(mlCharacters) + "([\\s\\S]*)");
			if (re.test(selection)) {
				return re.exec(selection).slice(1, 4).join("");
			}
			else {
				return mlCharacters + "\n" + selection + "\n" + mlCharacters;
			}
		}
		else {
			return Format.wrapper (characters);
		}
	}
}

/*
 * Ripped out of a stack overvlow thread
 * See http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 * Escapes all the necessary special chars for regex
 */
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

//
// Opens socket, establishes connection to pad based on url location hash
//
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


//
// Chat functionality
//
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
	} else {
		if (!prepend) {
			sendChatNotification(message);
		}
		classes += " bubble-other animated bounceIn";
	}

	console.info (message.color);

	chatdiv = $('<div>').addClass(classes).text(message.message).css('background-color', message.color);


	var chatpane = document.getElementById('chat-pane');

	//stash the height difference
	var shouldScroll = Math.abs(chatpane.scrollHeight - ($(chatpane).scrollTop() + $(chatpane).height()));

	if (prepend) {
		$('.chat-pane').prepend(chatdiv);
	} else {
		$('.chat-pane').append(chatdiv);
	}

	//decide whether to scroll or not.
	shouldScroll = shouldScroll < $(chatdiv).height() * 2 + 20

	if(shouldScroll) {
    	$(chatpane).scrollTop(chatpane.scrollHeight);
  	}
}

//load more chat messages from the server, prepending them to the chat messages.
function getMoreMessages() {
	$.get("/chat/" + pad_id + "/" + chatCount, function(data) {
		for (var ii = 0; ii < data.length; ii++) {
			console.log(data[ii]._source);
			addMessage(data[ii]._source, true);
		}
	});
}

$('.chat-pane').scroll(function() {
	console.log("it works");
});

function addTyping(data) {
	$("#typing-" + data.client).remove();
	if (data.value == 1) {
		var typing = $('<div>').addClass('typing-notify').attr('id', 'typing-' + data.client).text(data.client + " is typing");
		$('.typing-notify').append(typing);
	} else if (data.value == 2) { var typing = $('<div>').addClass('typing-notify').attr('id', 'typing-' + data.client).text(data.client + " has entered text");
		$('.typing-notify').append(typing);
	}
}

var chat = io(window.location.host + '/chat', function() {
	chat.emit('subscribe', window.pad_id)
});

chat.emit ('subscribe', window.pad_id);
chat.on   ('message'  , addMessage);
chat.on   ('typing'   , addTyping);

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
	chat.emit ('typing', {
		pad_id : window.pad_id,
		client : clientID,
		value  : typing
	});
}

$('#chat-message').keypress (function (event) {
  if (event.keyCode == 13) {
		message = $('#chat-message').val();
		if (message !== "") {
			message = {
				type 		: 'bubble',
				pad_id  : window.pad_id,
				client  : clientID,
				message : message,
        timestamp: new Date()
			};

			chat.emit ('message', message);
			addMessage (message);

			typing = 0;
			sendTyping ();

			$('#chat-message').val ('');
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

// Will remove the user from server on disconnect
window.addEventListener("beforeunload", function (e) {
	chat.emit ('disconnect', clientID);
});
