
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

  var instance = this;
  var stop = false;

  /*
   *  Sets the everything to .
   */
  this.setUp = function (callback) {
    $.get ('/ops/' + this.room, function (operations) {
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
  };


  this.reset = function () {
    instance.current_v = 0;
    instance.snapshot  = instance.operations[0].create.data;
    instance.time_slider.slider ('setValue', instance.current_v);
    instance.codemirror.setValue (instance.snapshot.text);

    $('#start-replay-button').removeClass ('active');
    $('#start-replay-button').find('span.glyphicon').removeClass ('glyphicon-pause').addClass ('glyphicon-play');
  }

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
          for (var i = instance.current_v; i < version; i++) {

            if (instance.operations[i].op) {
              instance.snapshot = ottypes.json0.apply (instance.snapshot, instance.operations[i].op);
            }
          }
        }

        instance.codemirror.setValue (instance.snapshot.text);
        instance.timestamps.draw (instance.snapshot.lines);
        instance.current_v = version;
        return 'Version: ' + version;
      }
    });
  }

  /*
   *  Starts document replay.
   */
  this.replay = function () {
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
    if (instance.current_v >= instance.operations.length) {
      $('#start-replay-button').toggleClass('active');
      $('#start-replay-button').find('span.glyphicon').toggleClass('glyphicon-pause').toggleClass('glyphicon-play');
      stop = false;
      return;
    } else if (stop) {
      stop = false;
      return;
    }

    instance.time_slider.slider ('setValue', instance.current_v + 1);

    setTimeout(function() {
      instance.slide ();
    }, instance.delay);
  };

  this.stop = function() {
    stop = true;
  };
}
