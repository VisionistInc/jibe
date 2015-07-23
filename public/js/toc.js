//
//  toc.js
//
//  - Manages the table of contents
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

function TOC(){

  this.editor = null;
  this.editorText = null;
  this.rootId = "toc-root";
  this.level = 0;
  this.lines = [];
  this.heads = [];
  this.lvlReg = /^(#{1,6})/;

  /*
  *  Parses each line and checks to see if the line is a header. If it is a header,
  *  it checks to see what level
  */
  this.parse = function(){
    this.lines = this.editorText.split('\n');
    //Generate regexp for different header levels
    var header = {};
    var len = this.lines.length;

    for (i = 0; i<len; i++){
      var match = this.lines[i].match(this.lvlReg);
      if (match !== null){
        var hlen = match[1].length;
        header = {};
        header.level = hlen;
        header.lineNum = i;
        header.hText = this.lines[i].substring(hlen,this.lines[i].length);
        header.idStr = "toc"+header.lineNum;
        this.heads.push(header);

      }
      }
    };
  /*
  * This generates a header by appending a list to the root container with
  *
  */
    this.generateHeaders = function(editor){
      // empty out the toc  (crazy what kinds of stuff you can get away with)
      $('#toc-root').empty();
      this.setEditor(editor);
      this.parse();
      var len = this.heads.length;
      for(i = 0;i<len;i++){
        if (this.heads[i].hText.length > 0){
          //keeping the nested list in case we want to add expanding and contracting functionality later
          $('#toc-root').append('<ul style = "list-style-type:none" class = "lvl" ><li><a  class = "list-group-item level level'+this.heads[i].level+'" data-linenum="'+this.heads[i].lineNum+'" id = "'+this.heads[i].idStr+'">'+this.heads[i].hText+'</a></li></ul>');
        }
      }
      this.heads = [];
    };

    this.setEditor = function(editor){
      this.editor = editor;
      this.editorText = editor.getValue();
    };
  }

module.exports = TOC;
