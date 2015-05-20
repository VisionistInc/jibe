(function() {

  if (typeof module !== 'undefined') {
    filterXSS = require('xss');
  }

  // Filter out potential XSS attacks before rendering HTML
  var noscript = function (converter) {
    return [
      {
        type: "lang",
        filter: function(text) {
          return filterXSS(text);
        }
      }
    ];
  };

  // Client-side export
  if (typeof window !== 'undefined' && window.Showdown && window.Showdown.extensions) {
    window.Showdown.extensions.noscript = noscript;
  }

  // Server-side export
  if (typeof module !== 'undefined') {
    module.exports = noscript;
  }
})();
