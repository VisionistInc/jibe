
//
//  replay.js
//
//  - View a replay of all operations that have occurred in a room.
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

function Replay (params) {
  this.chat         = params.chat;
  this.client       = params.client;
  this.codemirror   = params.codemirror;
  this.delay        = params.delay;
  this.room         = params.room;
  this.share        = params.share;
  this.timestamps   = params.timestamps;
  this.operations   = [];
  this.snapshot     = {};
  this.time_slider  = null;
  this.current_v    = null;
  this.old_toc      = params.old_toc;
  this.old_inst     = params.old_inst;
  this.old_tstamps  = params.old_tstamps;
  this.stopped      = false;
  this.flagged      = [];
  this.current_flag = null;
  this.next_flag    = 0;
  this.prev_flag    = null;

  var at_flag = false;
  var instance = this;
  var stop = false;

  var flagTemplate = '<div class="flagged-versions" style="left: {{percentLeft}}%">' +
    '<span class="glyphicon glyphicon-flag" aria-hidden="true"></span></div>';

  /*
   *  Sets the everything to .
   */
  this.setUp = function (callback) {
    $.get ('ops/' + this.room, function (operations) {
      if (operations[0] && operations[0].create) {
        instance.current_v  = 0;
        instance.operations = operations;
        instance.snapshot   = operations[0].create.data;
        instance.codemirror.setValue (instance.snapshot.text);

        instance.fireSliderEventHandlers ();
        instance.timestamps.draw (instance.snapshot.lines);

        callback ();
      }
    });

    // click handler for changing replay speed
    $('#speed-buttons-container button').on('click', function(event) {
      $activeButton = $(this);
      $activeButton.blur();
      instance.delay = Number($activeButton.data('delay'));
      $('#speed-buttons-container button').removeClass('active');
      $activeButton.toggleClass('active');
    });
  };

  /*
   *  Add any flagged versions to the replay slider div
   */
  this.addFlags = function() {
    this.flagged = [];
    this.current_flag = null;
    $('#flag-left').prop("disabled",true);
    for (var i = 0; i < instance.operations.length; i++) {
      if (instance.operations[i].flagged) {
        this.flagged.push(i);
        var percentLeft = (instance.operations[i].v / instance.operations.length * 100);
        var element = flagTemplate.replace('{{percentLeft}}', percentLeft);
        $('#replaySlider').append (element);
      }
    }
    if (this.flagged.length === 0){
      $('#flag-left').prop("disabled",true);
      $('#flag-right').prop("disabled",true);
    }
  };
  this.setVersion = function (version) {
    /*
     *  This fires whenever the timeslider moves --
     *  -- manually or programatically.
     */
    if (version < instance.current_v) {
      /*
       *  Unbuild the snapshot up to the desired version.
       */
      for (var i = instance.current_v - 1; i >= version; i--) {
        if (instance.operations[i].op) {
          instance.snapshot = ottypes.json0.apply (instance.snapshot, ottypes.json0.invert(instance.operations[i].op));
        }
      }
    } else if (version > instance.current_v) {
      /*
       *  Build the snapshot up to the desired version.
       */
      for (var j = instance.current_v; j < version; j++) {

        if (instance.operations[j].op) {
          instance.snapshot = ottypes.json0.apply (instance.snapshot, instance.operations[j].op);
        }
      }
    }

    instance.codemirror.setValue (instance.snapshot.text);
    instance.timestamps.draw (instance.snapshot.lines);
    instance.old_toc.generateHeaders(instance.codemirror);
    instance.current_v = version;
    instance.time_slider.slider ('setValue', instance.current_v);
    instance.setCurrentFlag();
    return 'Version: ' + version;
  };


  /*
  * Moves to next flag
  */
  this.nextFlag = function(){
    if (!this.stopped){
      $('#start-replay-button').toggleClass('active');
      $('#start-replay-button').find('span.glyphicon').toggleClass('glyphicon-pause').toggleClass('glyphicon-play');
      this.stop();
    }

    this.setVersion(this.flagged[this.next_flag]);
    at_flag = true;
  };

  /*
  * Moves to previous flag
  */
  this.prevFlag = function(){
    if(!this.stopped){
      $('#start-replay-button').toggleClass('active');
      $('#start-replay-button').find('span.glyphicon').toggleClass('glyphicon-pause').toggleClass('glyphicon-play');
      this.stop();
    }

    this.setVersion(this.flagged[this.prev_flag]);
    at_flag = true;



  };

  this.setCurrentFlag = function(){
    var index = 0;
    if (this.current_v < this.flagged[0]){
      this.current_flag = null;
      this.prev_flag = null;
      this.next_flag = 0;
    }
    else if(this.current_v === this.flagged[0]){
      this.current_flag = 0;
      this.prev_flag = null;
      this.next_flag = 1;
    }
    else if(this.current_v > this.flagged[this.flagged.length-1]){
      this.current_flag = this.flagged.length-1;
      this.prev_flag = this.flagged.length-1;
      this.next_flag = null;
    }
    else if(this.current_v === this.flagged[this.flagged.length-1]){
      this.current_flag = this.flagged.length-1;
      this.prev_flag = this.flagged.length-2;
      this.next_flag = null;
    }
    else{
      while(index < this.flagged.length-1){
        if (this.current_v > this.flagged[index] && this.current_v < this.flagged[index+1]){
          this.current_flag = index;
          this.prev_flag = index;
          this.next_flag = index+1;
          break;
        }
        else if(this.current_v === this.flagged[index]){
          this.current_flag = index;
          this.prev_flag = index - 1;
          this.next_flag = index + 1;
          break;
        }
        index++;
      }

    }
    this.checkFlagButtons();
  };

  this.checkFlagButtons = function(){
    if(this.prev_flag === null){
      $('#flag-left').prop("disabled",true);
    }
    else if(this.next_flag === null){
      $('#flag-right').prop("disabled",true);
    }
    else{
      $('#flag-left').prop("disabled",false);
      $('#flag-right').prop("disabled",false);
    }

  };


  this.reset = function () {
    instance.current_v = 0;
    instance.snapshot  = instance.operations[0].create.data;
    instance.time_slider.slider ('setValue', instance.current_v);
    instance.codemirror.setValue (instance.snapshot.text);

    $('#start-replay-button').removeClass ('active');
    $('#start-replay-button').find('span.glyphicon').removeClass ('glyphicon-pause').addClass ('glyphicon-play');
    this.stopped = true;

    // clear flags, since they will need to be redrawn next time
    $('#replaySlider .flagged-versions').remove();
  };

  /*
   *  Instantiates the slider within the controls container.
   */
  this.fireSliderEventHandlers = function () {
    instance.time_slider = $('#replay-slider').slider ({
      min: 0,
      max: instance.operations.length,
      value: 0,
      formatter: function (version) {
        /*
         *  This fires whenever the timeslider moves --
         *  -- manually or programatically.
         */
        if (version < instance.current_v) {
          /*
           *  Unbuild the snapshot up to the desired version.
           */
          for (var i = instance.current_v - 1; i >= version; i--) {
            if (instance.operations[i].op) {
              instance.snapshot = ottypes.json0.apply (instance.snapshot, ottypes.json0.invert(instance.operations[i].op));
            }
          }
        } else if (version > instance.current_v) {
          /*
           *  Build the snapshot up to the desired version.
           */
          for (var j = instance.current_v; j < version; j++) {

            if (instance.operations[j].op) {
              instance.snapshot = ottypes.json0.apply (instance.snapshot, instance.operations[j].op);
            }
          }
        }

        instance.codemirror.setValue (instance.snapshot.text);
        instance.timestamps.draw (instance.snapshot.lines);
        instance.old_toc.generateHeaders(instance.codemirror);
        instance.current_v = version;
        instance.setCurrentFlag();
        return 'Version: ' + version;
      }
    });
  };

  /*
   *  Starts document replay.
   */
  this.replay = function () {
    this.stopped = false;
    if (instance.current_v >= instance.operations.length) {
      instance.setUp (function () {
        instance.replay ();
      });
    } else {
      instance.slide ();
    }
  };

  /*
   *  Recursively plays through the rest of the operations.
   */
  this.slide = function () {
    if (instance.current_v >= instance.operations.length || (instance.operations[instance.current_v].flagged && !at_flag)) {
      console.log(this.flagged);
      at_flag = true;
      $('#start-replay-button').toggleClass('active');
      $('#start-replay-button').find('span.glyphicon').toggleClass('glyphicon-pause').toggleClass('glyphicon-play');
      this.current_flag =
      this.stopped = true;
      stop = false;
      return;
    } else if (stop) {
      at_flag = false;
      stop = false;
      return;
    }
    at_flag = false;
    instance.time_slider.slider ('setValue', instance.current_v + 1);

    setTimeout(function() {
      instance.slide ();
    }, instance.delay);
  };

  this.stop = function() {
    this.stopped = true;
    stop = true;
    at_flag = true;
  };
}
