var please = require ('pleasejs');

module.exports = (function() {
    var public = {};

    //TODO store authors in the database
    var authorMap = {};

    public.all = function() {
        return authorMap;
    };

    public.getOrCreate = function(authorId) {
        return authorMap[authorId] || public.new(authorId, newColor());
    };

    public.load = function(authorId) {
        return authorMap[authorId];
    };

    public.new = function(authorId, authorColor) {
        var author = {
            id: authorId,
            color: authorColor
        };

        authorMap[authorId] = author;

        return author;
    };

    function newColor() {
        return please.make_color({
          saturation : 1.0,
          value      : 0.8
        })[0];
    }

    return public;
})();
