
//
//  room-model-test.js
//
//  - Tests the thinky model for Room records.
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

var Room   = require('../lib/models/Room'),
    expect = require('expect.js');

describe('jibe (Room model)', function() {

  var room;

  var sampleData = {
    id: 'room1',
    presentAuthors: ['author1', 'author2']
  };

  afterEach(function(done) {
    // clear room table after each test
    Room.delete().run(function(error, result) {
      done();
    });
  });

  describe('#new', function() {
    it('requires an id', function(done) {
      room = new Room({});

      room.save().then(function(result) {
        expect().fail('error on save');
      }).error(function(error) {
        var expected = 'Value for [id] must be defined.';
        expect(error.message).to.eql(expected);
        done();
      });
    });

    it('uses the given id when one is supplied', function(done) {
      room = new Room({
        id: sampleData.id
      });

      expect(room.id).to.eql(sampleData.id);

      room.save().then(function(result) {
        expect(result.id).to.eql(sampleData.id);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });

    it('presentAuthors defaults to an empty array', function(done) {
      room = new Room({
        id: sampleData.id
      });

      room.save().then(function(result) {
        expect(result.presentAuthors).to.eql([]);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });

    it('stores the provided presentAuthors array', function(done) {
      room = new Room({
        id: sampleData.id,
        presentAuthors: sampleData.presentAuthors
      });

      expect(room.presentAuthors).to.eql(sampleData.presentAuthors);

      room.save().then(function(result) {
        expect(result.presentAuthors).to.eql(sampleData.presentAuthors);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });
  });

  describe('#getOrCreate', function() {
    it('creates a room with the given id if it does not exist', function(done) {
      Room.getOrCreate(sampleData.id, function(room) {
        expect(room.id).to.eql(sampleData.id);
        expect(room.presentAuthors).to.eql([]);
        done();
      });
    });

    it('returns the existing room when one with the given id exists', function(done) {
      room = new Room({
        id: sampleData.id,
        presentAuthors: sampleData.presentAuthors
      });

      room.save().then(function(result) {
        Room.getOrCreate(sampleData.id, function(foundRoom) {
          expect(foundRoom).to.not.be(null); // would mean error

          expect(foundRoom.id).to.eql(sampleData.id);
          expect(foundRoom.presentAuthors).to.eql(sampleData.presentAuthors);
          done();
        });
      }).error(function(error) {
        expect().fail('error on save');
      });
    });
  });

  describe('.presentAuthors', function() {
    it('fails validation if authors are not unique', function(done) {
      room = new Room({
        id: sampleData.id,
        presentAuthors: sampleData.presentAuthors
      });

      room.save().then(function(result) {
        room.presentAuthors.push(sampleData.presentAuthors[0]);

        room.save().then(function(result) {
          expect().fail('expected validation error');
        }).error(function(error) {
          expect(error.message).to.eql('Duplicate value [author1] found in Room.presentAuthors');
          done();
        });
      });
    });
  });
});
