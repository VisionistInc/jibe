
//
//  Author.js
//
//  - Model for a single author, including colors and other stuff.
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
