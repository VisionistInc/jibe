
//
//  chat-model-test.js
//
//  - Tests the thinky model for Chat records.
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

var Chat = require('../lib/models/Chat'),
    expect = require('expect.js');

describe('jibe (Chat model)', function() {

  var chat;

  var sampleData = {
    id: 'chat1',
    roomId: 'Testing',
    authorId: 'Tester',
    message: 'Testing testing 1, 2, 3',
    timestamp: new Date(),
    color: '#123456'
  };

  afterEach(function(done) {
    // clear chat table after each test
    Chat.delete().run(function(error, result) {
      done();
    });
  });

  describe('#new', function() {
    it('creates an id if one is not supplied', function(done) {
      chat = new Chat({
        roomId: sampleData.roomId,
        authorId: sampleData.authorId,
        message: sampleData.message,
        color: sampleData.color
      });

      expect(chat.id).to.not.be(null);

      chat.save().then(function(result) {
        expect(result.id).to.not.be(null);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });

    it('uses the given id when one is supplied', function(done) {
      chat = new Chat({
        id: sampleData.id,
        roomId: sampleData.roomId,
        authorId: sampleData.authorId,
        message: sampleData.message,
        color: sampleData.color
      });

      expect(chat.id).to.eql(sampleData.id);

      chat.save().then(function(result) {
        expect(result.id).to.eql(sampleData.id);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });

    it('requires a roomId', function(done) {
      chat = new Chat({
        authorId: sampleData.authorId,
        message: sampleData.message,
        color: sampleData.color
      });

      chat.save().then(function(result) {
        expect().fail('expected error on save, but got result', result);
      }).error(function(error) {
        expect(error.message).to.eql('Value for [roomId] must be defined.');
        done();
      });
    });

    it('requires an authorId', function(done) {
      chat = new Chat({
        roomId: sampleData.roomId,
        message: sampleData.message,
        color: sampleData.color
      });

      chat.save().then(function(result) {
        expect().fail('expected error on save, but got result', result);
      }).error(function(error) {
        expect(error.message).to.eql('Value for [authorId] must be defined.');
        done();
      });
    });

    it('requires a message', function(done) {
      chat = new Chat({
        roomId: sampleData.roomId,
        authorId: sampleData.authorId,
        color: sampleData.color
      });

      chat.save().then(function(result) {
        expect().fail('expected error on save, but got result', result);
      }).error(function(error) {
        expect(error.message).to.eql('Value for [message] must be defined.');
        done();
      });
    });

    it('requires a color', function(done) {
      chat = new Chat({
        roomId: sampleData.roomId,
        authorId: sampleData.authorId,
        message: sampleData.message
      });

      chat.save().then(function(result) {
        expect().fail('expected error on save, but got result', result);
      }).error(function(error) {
        expect(error.message).to.eql('Value for [color] must be defined.');
        done();
      });
    });

    it('creates a timestamp if one is not supplied', function(done) {
      chat = new Chat({
        roomId: sampleData.roomId,
        authorId: sampleData.authorId,
        message: sampleData.message,
        color: sampleData.color
      });

      expect(chat.timestamp).to.not.be(null);

      chat.save().then(function(result) {
        expect(result.timestamp).to.not.be(null);
        done();
      }).error(function(error) {
        expect().fail('error on save', result);
      });
    });

    it('uses the given timestamp when one is supplied', function(done) {
      chat = new Chat({
        roomId: sampleData.roomId,
        authorId: sampleData.authorId,
        message: sampleData.message,
        timestamp: sampleData.timestamp,
        color: sampleData.color
      });

      expect(chat.timestamp).to.eql(sampleData.timestamp);

      chat.save().then(function(result) {
        expect(result.timestamp).to.eql(sampleData.timestamp);
        done();
      }).error(function(error) {
        expect().fail('error on save', result);
      });
    });

    it('does not have the same timestamp', function(done) {
      chat1 = new Chat({
        roomId: sampleData.roomId,
        authorId: sampleData.authorId,
        message: sampleData.message,
        color: sampleData.color
      });
      chat2 = new Chat({
        roomId: sampleData.roomId,
        authorId: sampleData.authorId,
        message: sampleData.message,
        color: sampleData.color
      });

      expect(chat1.timestamp).to.not.eql(chat2.timestamp);

      chat1.save().then(function(result) {
        chat2.save().then(function(result2){
          expect(result2.timestamp).to.not.eql(result.timestamp);
          done();
        });
      }).error(function(error) {
        expect().fail('error on save', result);
      });
    });
  });
});
