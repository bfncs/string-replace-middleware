# String Replace Middleware

A middleware for [Express](http://expressjs.com/) that allows for stream-based string replacement before sending responses.

## Installation

Install in your Express project using:

```
npm install --save string-replace-middleware
````

## Usage

After installing, you can add it as a middleware to your project and hand over a map of replacements. To replace every occurence of `foo` with `bar`.

```javascript
const express = require('express');
const stringReplace = require('string-replace-middleware');

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
const stringReplace = require('string-replace-middleware');

const app = express();

app.use(stringReplace({
    'foo': 'bar',
}));
app.use(serveStatic('public'));

app.listen(3000);
```