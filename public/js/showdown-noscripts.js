(function() {
  var noscript = function (converter) {
    return [
      // Turn HTML <script> tags into harmless code blocks
      {
        type: "lang",
        regex: "<[\/]*script[^>]*>",
        replace: "```"
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
