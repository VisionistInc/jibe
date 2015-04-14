# jibe
Jibe: be in accord; agree. A modern, lightweight, collaborative editing environment.

## Installation
* `npm install`
* Start [Elasticsearch 1.4+](https://www.elastic.co/downloads/elasticsearch) with default settings
* `npm start`
* Go to [http://localhost:3000](http://localhost:3000)

## Integrating with your application via npm
* `npm install --save VisionistInc/jibe`
* Require jibe within your express app.

        var app = require('express')(),
            server = require('http').createServer(app),
            io = require('socket.io').listen(server),
            jibe = require('jibe');

        // initialize jibe
        app.use('/path/to/jibe', jibe.router(io));
        app.use(jibe.browserChannelMiddleware);

        server.listen (3000, function () {
            console.info ('Server listening at port 3000');
        });

* Visit [http://localhost:3000/path/to/jibe](http//localhost:3000/path/to/jibe)!
