var elasticsearch = require('elasticsearch'),
    router = require('express').Router(),
    es_client = new elasticsearch.Client({host: 'localhost:9200', log: 'trace'});

// load up to 50 chat messages beginning at :start
router.get('/:id/:start', function(req, res) {
  console.log(req.params.id, req.params.start);
  es_client.search({
    index: 'jibe',
    ignore_unavailable: true,
    type: 'chat',
    size: 50,
    q: "pad_id:" + req.params.id,
    sort: "timestamp:desc",
    from: req.params.start
  }).then(function(results) {
      res.json(results.hits.hits);
  });
});

module.exports = router;
