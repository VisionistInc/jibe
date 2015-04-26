
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
  this.doneCallback = params.callback;
  this.room         = params.room;
  this.share        = params.share;
  this.timestamps   = params.timestamps;

  var instance = this;
  var stop = false;

  // TODO
  // - is the second textarea and codemirror instance necessary?
  // - - hinges on whether or not sharejs extension can be switched off
  // - add in chat messages to replay
  // - - clear chat log
  // - - merge chat history in with operations log
  // - - instance.chat.addMessage
  // - ability to start at / jump to any point in history
  this.replay = function() {
    $.get('/ops/' + this.room, function(operations) {
      var snapshot = {};
      if (operations[0] && operations[0].create) {
        snapshot = operations[0].create.data;

        // recursively play through the rest of the operations
        instance.delayReplay(snapshot, operations, 1);
      }
    });
  };

  this.delayReplay = function(snapshot, operations, version) {
    if (version >= operations.length) {
      console.log('done');
      stop = false;

      if (instance.doneCallback) {
        instance.doneCallback();
      }

      return;
    } else if (stop) {
      console.log('stopped');
      stop = false;
      return;
    }

    if (operations[version].op) {
      snapshot = ottypes.json0.apply(snapshot, operations[version].op);
      instance.codemirror.setValue(snapshot.text);
      instance.timestamps.draw(snapshot.lines);
    }

    setTimeout(function() {
      instance.delayReplay(snapshot, operations, version+1);
    }, instance.delay);
  };

  this.onComplete = function(callback) {
    this.doneCallback = callback;
  };

  this.stop = function() {
    stop = true;
  };
}
