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

function TOC(editor){
  this.editor = editor;
  this.editorText = this.editor.getValue();
  this.rootId = "toc-root";
  this.level = 0;
  this.lines = [];
  this.heads = [];
  this.idNum = 0;

   this.parse = function(){
    this.lines = this.editorText.split('\n');
    var len = this.lines.length;
    var lvl1Reg = new RegExp(/^#{1}/);
    var lvl2Reg = new RegExp(/^#{2}/);
    var lvl3Reg = new RegExp(/^#{3}/);
    var lvl4Reg = new RegExp(/^#{4}/);
    var lvl5Reg = new RegExp(/^#{5}/);
    var lvl6Reg = new RegExp(/^#{6}/);
    var header = {};
    for (i = 0; i<len; i++){
      if (this.lines[i].search(lvl6Reg) != -1){
        header = {};
        header.level = 6;
        header.hText = this.lines[i].substring(6,this.lines[i].length);
        header.lineNum = i;
        header.idNum = this.idNum++;
        header.idStr = "#toc"+header.lineNum;
        this.heads.push(header);

      }
      else if (this.lines[i].search(lvl5Reg) != -1){
        header = {};
        header.level = 5;
        header.hText = this.lines[i].substring(5,this.lines[i].length);
        header.lineNum = i;
        header.idNum = this.idNum++;
        header.idStr = "#toc"+header.lineNum;
        this.heads.push(header);

      }
      else if (this.lines[i].search(lvl4Reg) != -1){
        header = {};
        header.level = 4;
        header.hText = this.lines[i].substring(4,this.lines[i].length);
        header.lineNum = i;
        header.idNum = this.idNum++;
        header.idStr = "#toc"+header.lineNum;
        this.heads.push(header);

      }
      else if (this.lines[i].search(lvl3Reg) != -1){
        header = {};
        header.level = 3;
        header.hText = this.lines[i].substring(3,this.lines[i].length);
        header.lineNum = i;
        header.idNum = this.idNum++;
        header.idStr = "#toc"+header.lineNum;
        this.heads.push(header);

      }
      else if (this.lines[i].search(lvl2Reg) != -1){
        header = {};
        header.level = 2;
        header.hText = this.lines[i].substring(2,this.lines[i].length);
        header.lineNum = i;
        header.idNum = this.idNum++;
        header.idStr = "#toc"+header.lineNum;
        this.heads.push(header);

      }
      else if (this.lines[i].search(lvl1Reg) != -1){
        header = {};
        header.level = 1;
        header.hText = this.lines[i].substring(1,this.lines[i].length);
        header.lineNum = i;
        header.idNum = this.idNum++;
        header.idStr = "#toc"+header.lineNum;
        this.heads.push(header);

      }
      }
    };
 id = "'+this.heads[i].idStr+'";
  this.generateHeaders = function(){
    $('#toc-root').empty();
    this.parse();
    var len = this.heads.length;
    for(i = 0;i<len;i++){
      //if (this.heads[i].level == 1){
      if (this.heads[i].hText.length > 0){
        $('#toc-root').append('<ul style = "list-style-type:none" class = "lvl" ><li><a  class = "list-group-item level level'+this.heads[i].level+'"  id = "'+this.heads[i].idStr+'">'+this.heads[i].hText+'</a></li></ul>');
      }
      //}
    /*  else{
        this.heads[i].root = '#toc-root';
        for (j = i;j>=0;j--){
          if (this.heads[j].level < this.heads[i].level){
            this.heads[i].root = '#toc'+this.heads[j].idNum.toString();
            break;
          }
        }
        var root = $('#toc-root').find(this.heads[i].root);
        //root.append('<ul style = "list-style-type:none" class = "lvl" id="#toc'+this.heads[i].idNum.toString()+'"><li><a  class = "list-group-item level level'+this.heads[i].level+'">'+this.heads[i].hText+'</a></li></ul>');
        $('#toc3').append('<ul style = "list-style-type:none" class = "lvl" id="#toc'+this.heads[i].idNum.toString()+'"><li><a  class = "list-group-item level level'+this.heads[i].level+'">'+this.heads[i].hText+'</a></li></ul>');

      }
      */
    }

  };
  }
