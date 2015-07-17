# jibe

![Jibe: be in accord; agree.](https://raw.githubusercontent.com/VisionistInc/jibe/master/public/img/jibe_logo_blue_on_white_short.png)

A modern, lightweight, collaborative editing environment.

[![npm version](https://badge.fury.io/js/jibe.svg)](http://badge.fury.io/js/jibe)
[![Build Status](https://travis-ci.org/VisionistInc/jibe.svg?branch=master)](https://travis-ci.org/VisionistInc/jibe)

[Jibe Demo](http://jibe.visionistinc.com/)

## Installation
* `npm install`
* `npm start`
* Go to [http://localhost:3000](http://localhost:3000)

## Database setup
Jibe requires [RethinkDB](http://www.rethinkdb.com/) for data persistance.

If you do not have a RethinkDB server available, you can easily [install it locally](http://rethinkdb.com/docs/install/) or use the [Docker](https://www.docker.com/) image:

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
            jibe = require('jibe')();

        // initialize jibe
        app.use('/path/to/jibe', jibe.router(io));
        app.use(jibe.browserChannelMiddleware);

        server.listen (3000, function () {
            console.info ('Server listening at port 3000');
        });

* Visit [http://localhost:3000/path/to/jibe](http://localhost:3000/path/to/jibe)!

## Configuration

### Server

When jibe is `require`-ed, it is possible to pass in configuration options for connecting to RethinkDB.  For example, the snippet below will tell jibe to use the given configuration.

```javascript
jibe = require('jibe')({
  config: {
    "rethinkdb": {
      "host": "127.0.0.1",
      "port": 28015,
      "db": "jibe"
    }
  }
});
```

If no options are provided, jibe will use one of the configurations in `lib/config/env` based on the `process.env.NODE_ENV` environment variable.

### Client

Currently, the client-side constructor offers a few configuration options.  Defaults are provided for each option, so none are required.

```javascript
$('#jibe-container').jibe ({
  defaultText: "# Welcome to {{room}}\n\n\n",
  placeholder: "This is a configurable placeholder, type your text here...",
  template: "templates/editor.html"
});
```

* The `defaultText` option sets the initial text for a document that **does not exist** at the time it is requested by the client.  The name of the current room will replace all instances of the pattern `{{room}}`.
* Overriding the `placeholder` option sets the text that is displayed when the document contains no text (just like the HTML input element's placeholder attribute).
* The `template` option allows developers to use a different layout, rather than the default one that is provided in this repository.  There are some hardcoded ids that event handlers rely on, so it is easiest to start from the provided template and rearrange things from there.
