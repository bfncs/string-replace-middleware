# String Replace Middleware

A middleware for [Express](http://expressjs.com/) that allows for stream-based string replacement before sending responses.

## Installation

Install in your Express project using:

```
npm install --save string-replace-middleware
```

## Usage

After installing, you can add it as a middleware to your project and hand over a map of replacements. To replace every occurence of `foo` with `bar`.

```javascript
const express = require('express');
const { stringReplace } = require('string-replace-middleware');

const app = express();

app.use(stringReplace({
    'foo': 'bar',
}));

app.listen(3000);
```

Use it to serve static files with replacements like in this example:

```javascript
const express = require('express');
const serveStatic = require('serve-static');
const { stringReplace } = require('string-replace-middleware');

const app = express();

app.use(stringReplace({
    'foo': 'bar',
}));
app.use(serveStatic('public'));

app.listen(3000);
```

## Configuration

The Content-Type header of responses is checked against a regex before modification. The regex is configurable by passing in
an options object like this:

```javascript
const options = {
  contentTypeFilterRegexp: /^text\/|^application\/json$|^application\/xml$/,
}

app.use(stringReplace({
    'foo': 'bar',
}, options));
```

The default regex is `/^text\/|^application\/json$|^application\/xml$/`, which will match `text/*`, `application/json`, and `application/xml`. Any response with a Content-Type header that doesn't match the regex is ignored and passed-through without modification. 

Also any response without a Content-Type header is ignored and passed-through without any modification.