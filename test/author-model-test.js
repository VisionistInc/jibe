var Author = require('../lib/models/Author'),
    expect = require('expect.js');

describe('jibe (Author model)', function() {

  var author;

  var sampleData = {
    id: 'author1',
    color: '#123456'
  };

  afterEach(function(done) {
    // clear chat table after each test
    Author.delete().then(function(result) {
      done();
    });
  });

  describe('#new', function() {
    it('creates an id if one is not supplied', function(done) {
      author = new Author({});

      expect(author.id).to.not.be(null);

      author.save().then(function(result) {
        expect(result.id).to.not.be(null);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });

    it('uses the given id when one is supplied', function(done) {
      author = new Author({
        id: sampleData.id
      });

      expect(author.id).to.eql(sampleData.id);

      author.save().then(function(result) {
        expect(result.id).to.eql(sampleData.id);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });

    it('creates a color if one is not supplied', function(done) {
      author = new Author({});

      expect(author.color).to.not.be(null);

      author.save().then(function(result) {
        expect(result.color).to.not.be(null);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });

    it('uses the given color when one is supplied', function(done) {
      author = new Author({
        color: sampleData.color
      });

      expect(author.color).to.eql(sampleData.color);

      author.save().then(function(result) {
        expect(result.color).to.eql(sampleData.color);
        done();
      }).error(function(error) {
        expect().fail('error on save');
      });
    });
  });

  describe('#getOrCreate', function() {
    it('creates an author with the given id if it does not exist', function(done) {
      Author.getOrCreate(sampleData.id, function(author) {
        expect(author.id).to.eql(sampleData.id);
        expect(author.color).to.not.be(null);
        done();
      });
    });

    it('returns the existing author when one with the given id exists', function(done) {
      author = new Author({
        id: sampleData.id,
        color: sampleData.color
      });

      author.save().then(function(result) {
        Author.getOrCreate(sampleData.id, function(foundAuthor) {
          expect(foundAuthor).to.not.be(null); // would mean error

          expect(foundAuthor.id).to.eql(sampleData.id);
          expect(foundAuthor.color).to.eql(sampleData.color);
          done();
        });
      }).error(function(error) {
        expect().fail('error on save');
      });
    });
  });
});
