[![Build Status](https://travis-ci.org/nspragg/http-transport-callbacks.svg)](https://travis-ci.org/nspragg/http-transport-callbacks) [![Coverage Status](https://coveralls.io/repos/github/nspragg/http-transport-callbacks/badge.svg?branch=master)](https://coveralls.io/github/nspragg/http-transport-callbacks?branch=master)

# HttpTransportToError

> Adds callbacks support for http-transport

## Installation

```
npm install --save http-transport-callbacks
```

## Usage

Callback support using default HTTP transport:
```js

const HttpTransport = require('http-transport-callbacks');

HttpTransport.createClient()
   .get('http://example.com')
   .asResponse((err, res) => {
      if (err) return console.error(err);
      console.log(res);
   });
});
```

Add callback support using custom HTTP transport:
```js

const HttpTransport= require('http-transport-callbacks');
const wreckTransport = require('http-transport-wreck');

function createCustomTransport() {
    return require('http-transport').createClient(WreckTransport);
}

HttpTransportWithCallbacks.createClient(createCustomTransport())
   .get('http://example.com')
   .asResponse((err, res) => {
      if (err) return console.error(err);
      console.log(res);
   });
});
```

## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
