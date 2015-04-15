
$('#jibe-container').jibe ();







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
