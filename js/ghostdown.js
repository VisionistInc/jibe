
window.editor = {};

//TODO, let users pick their nicknames or get it from a cookie or something.
var clientID = Math.floor((Math.random() * 10000000));

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
				wordCount.innerHTML = editorValue.match(/\S+/g).length + ' words';
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

			window.editor.on ("change", function () {
				updatePreview();
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
	Format.replace (Format.wrapper ('*'));
}

Format.code = function () {
	Format.replace (Format.wrapper ('`'));
}

Format.wrapper = function (characters) {
	if (window.editor.somethingSelected ()) {
		var selection = window.editor.getSelection ();
		var match	  = false;
		var chars     = ['**', '*', '`'];

		for (var i = 0; i < chars.length; i++) {
			if (selection.startsWith (chars[i]) && selection.endsWith (chars[i])) {
				selection = selection.slice (chars[i].length, selection.length - chars[i].length);
				if (chars[i] == characters) {
					match = true;
				}
				break;
			}
		}

		if (match) {
			return selection;
		} else {
			return (characters + selection + characters);
		}
	} else {
		var index = window.editor.indexFromPos (window.editor.getCursor ());
		window.editor.replaceSelection (characters + characters);
		window.editor.setCursor (window.editor.posFromIndex (index + 2));
	}
}

//
// Opens socket, establishes connection to pad based on url location hash
//
var pad_id = location.hash;
if (pad_id == '') {
	// Using default hash
	pad_id = "The Dark Side";
}

var socket = new BCSocket (null, { reconnect: true });
var share  = new window.sharejs.Connection (socket);
var pad    = share.get ('users', pad_id);

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
function addMessage(message) {
	console.log(message);
	var classes = "chat-message";

	if (message.client == clientID) {
		classes += " bubble-mine animated bounceIn";
	} else {
		classes += " bubble-other animated bounceIn";
	}

	chatdiv = $('<div>').addClass(classes).text(message.message);
	$('.chat-pane').append(chatdiv);
}

var chat = io(window.location.host + '/chat', function() { chat.emit('subscribe', pad_id)});
chat.emit('subscribe', pad_id);
chat.on('message', addMessage);

$('#chat-message').keypress (function (event) {
    if (event.keyCode == 13) {
		message = $('#chat-message').val();
		message = {pad_id: pad_id, client: clientID, message: message};

		chat.emit ('message', message);
		addMessage (message);

		$('#chat-message').val ('');
		return false;
    }
});
