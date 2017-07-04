const _ = require('lodash');
const assert = require('chai').assert;
const nock = require('nock');

const HttpTransport = require('..');
const toError = require('http-transport-to-error');
const packageInfo = require('../package');

const url = 'http://www.example.com/';
const host = 'http://www.example.com';
const api = nock(host);
const path = '/';

const simpleResponseBody = 'Illegitimi non carborundum';
const requestBody = {
  foo: 'bar'
};
const responseBody = requestBody;

function nockRetries(retry, opts) {
  const httpMethod = _.get(opts, 'httpMethod') || 'get';
  const successCode = _.get(opts, 'successCode') || 200;

  nock.cleanAll();
  api[httpMethod](path).times(retry).reply(500);
  api[httpMethod](path).reply(successCode);
}

describe('HttpTransport', () => {
  beforeEach(() => {
    nock.disableNetConnect();
    nock.cleanAll();
    api.get(path).reply(200, simpleResponseBody);
  });

  describe('.get', () => {
    it('returns a response', (done) => {
      HttpTransport.createClient()
        .get(url)
        .asResponse((err, res) => {
          assert.ifError(err);
          assert.equal(res.body, simpleResponseBody);
          done();
        });
    });

    it('sets a default User-agent', (done) => {
      nock.cleanAll();

      const HeaderValue = `${packageInfo.name}/${packageInfo.version}`;
      nock(host, {
          reqheaders: {
            'User-Agent': HeaderValue
          }
        })
        .get(path)
        .reply(200, responseBody);

      HttpTransport.createClient()
        .get(url)
        .asResponse(() => {
          done();
        });
    });

    it('throws if a plugin is not a function', () => {
      assert.throws(() => {
        HttpTransport.createClient()
          .useGlobal('bad plugin')
          .headers();
      }, TypeError, 'Plugin is not a function');
    });
  });

  describe('.retries', () => {
    it('retries a given number of times for failed requests', (done) => {
      nockRetries(2);
      HttpTransport.createClient()
        .useGlobal(toError())
        .get(url)
        .retry(2)
        .asResponse((err, res) => {
          assert.ifError(err);
          assert.equal(res.statusCode, 200);
          done();
        });
    });

    it.skip('tracks retry attempts', (done) => {
      nockRetries(2);

      HttpTransport.createClient()
        .useGlobal(toError())
        .get(url)
        .retry(2)
        .asResponse((err, res) => {
          assert.ifError(err);
          const retries = res.retries;
          assert.equal(retries.length, 2);
          assert.equal(retries[0].statusCode, 500);
          assert.match(retries[0].reason, /Request failed for GET http:\/\/www.example.com.*/);
          done();
        });
    });
  });

  describe('.post', () => {
    it('makes a POST request', (done) => {
      api.post(path, requestBody).reply(201, responseBody);

      HttpTransport.createClient()
        .post(url, requestBody)
        .asBody((err, body) => {
          assert.ifError(err);
          assert.deepEqual(body, responseBody);
          done();
        });
    });

    it('returns an error when the API returns a 5XX status code', (done) => {
      api.post(path, requestBody).reply(500);

      HttpTransport.createClient()
        .useGlobal(toError())
        .post(url, requestBody)
        .asResponse((err) => {
          assert.ok(err);
          done();
        });
    });
  });

  describe('.put', () => {
    it('makes a PUT request with a JSON body', (done) => {
      api.put(path, requestBody).reply(201, responseBody);

      HttpTransport.createClient()
        .put(url, requestBody)
        .asBody((err, body) => {
          assert.deepEqual(body, responseBody);
          done();
        });
    });

    it('returns an error when the API returns a 5XX status code', (done) => {
      api.put(path, requestBody).reply(500);

      HttpTransport.createClient()
        .useGlobal(toError())
        .put(url, requestBody)
        .asResponse((err) => {
          assert.ok(err);
          done();
        });
    });
  });

  describe('.delete', () => {
    it('makes a DELETE request', (done) => {
      api.delete(path).reply(204);
      HttpTransport.createClient()
        .delete(url)
        .asResponse(done);
    });

    it('returns an error when the API returns a 5XX status code', (done) => {
      api.delete(path).reply(500);

      HttpTransport.createClient()
        .delete(url)
        .asResponse((err) => {
          assert.ifError(err);
          done();
        });
    });
  });

  describe('.patch', () => {
    it('makes a PATCH request', (done) => {
      api.patch(path).reply(204);
      HttpTransport.createClient()
        .patch(url)
        .asResponse((err) => {
          assert.ifError(err);
          done();
        });
    });

    it('returns an error when the API returns a 5XX status code', (done) => {
      api.patch(path, requestBody).reply(500);

      HttpTransport.createClient()
        .patch(url, requestBody)
        .asResponse((err) => {
          assert.ifError(err);
          done();
        });
    });
  });

  describe('.head', () => {
    it('makes a HEAD request', (done) => {
      api.head(path).reply(200);

      HttpTransport.createClient()
        .head(url)
        .asResponse((err, res) => {
          assert.ifError(err);
          assert.strictEqual(res.statusCode, 200);
          done();
        });
    });

    it('returns an error when the API returns a 5XX status code', (done) => {
      api.head(path).reply(500);

      HttpTransport.createClient()
        .head(url)
        .asResponse((err) => {
          assert.ifError(err);
          done();
        });
    });
  });

  describe('.headers', () => {
    it('sends a custom headers', (done) => {
      nock.cleanAll();

      const HeaderValue = `${packageInfo.name}/${packageInfo.version}`;
      nock(host, {
          reqheaders: {
            'User-Agent': HeaderValue,
            foo: 'bar'
          }
        })
        .get(path)
        .reply(200, responseBody);

      HttpTransport.createClient()
        .get(url)
        .headers({
          'User-Agent': HeaderValue,
          foo: 'bar'
        })
        .asResponse((err, res) => {
          assert.ifError(err);
          assert.equal(res.statusCode, 200);
          done();
        });
    });

    it('asserts for a missing header', () => {
      assert.throws(() => {
        HttpTransport.createClient()
          .get(url)
          .headers();
      }, Error, 'missing headers');
    });

    it('asserts an empty header object', () => {
      assert.throws(() => {
        HttpTransport.createClient()
          .get(url)
          .headers({});
      }, Error, 'missing headers');
    });
  });

  describe('query strings', () => {
    it('supports adding a query string', (done) => {
      api.get('/?a=1').reply(200, simpleResponseBody);

      HttpTransport.createClient()
        .get(url)
        .query('a', 1)
        .asBody((err, body) => {
          assert.ifError(err);
          assert.equal(body, simpleResponseBody);
          done();
        });
    });

    it('supports multiple query strings', (done) => {
      nock.cleanAll();
      api.get('/?a=1&b=2&c=3').reply(200, simpleResponseBody);

      HttpTransport.createClient()
        .get(url)
        .query({
          'a': 1,
          'b': 2,
          'c': 3,
        })
        .asBody((err, body) => {
          assert.ifError(err);
          assert.equal(body, simpleResponseBody);
          done();
        });
    });

    it('asserts empty query strings object', () => {
      assert.throws(() => {
        HttpTransport.createClient()
          .get(url)
          .query({});
      }, Error, 'missing query strings');
    });
  });
});
