# jibe

![Jibe: be in accord; agree.](https://raw.githubusercontent.com/VisionistInc/jibe/master/public/img/jibe_logo_blue_on_white.png)
A modern, lightweight, collaborative editing environment.

## Installation
* `npm install`
* Start [Elasticsearch 1.4+](https://www.elastic.co/downloads/elasticsearch) with default settings
* `npm start`
* Go to [http://localhost:3000](http://localhost:3000)

## Database setup
Jibe requires [RethinkDB](http://www.rethinkdb.com/) for data persistance.

If you do not have a RethinkDB server available, you can use  [Docker](https://www.docker.com/) to quickly have one running:

```
docker pull rethinkdb
docker run -d -p 8080:8080 -p 28015:28015 -p 29015:29015 rethinkdb
```

Now, browse to [RethinkDB's Tables tab](http://localhost:8080/#tables) and create a new database called 'jibe'.

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

* Visit [http://localhost:3000/path/to/jibe](http://localhost:3000/path/to/jibe)!
