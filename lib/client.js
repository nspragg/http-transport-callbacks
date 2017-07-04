'use strict';

const Bluebird = require('bluebird');
const HttpTransport = require('http-transport');

class CallbackWrapper {
  constructor(delegate) {
    this.delegate = delegate;
  }

  useGlobal(plugin) {
    this.delegate.useGlobal(plugin);
    return this;
  }

  retry(retries) {
    this.delegate.retry(retries);
    return this;
  }

  get(url) {
    this.delegate.get(url);
    return this;
  }

  post(url, body) {
    this.delegate.post(url, body);
    return this;
  }

  put(url, body) {
    this.delegate.put(url, body);
    return this;
  }

  head(url) {
    this.delegate.head(url);
    return this;
  }

  headers() {
    this.delegate.headers.apply(null, arguments);
    return this;
  }

  query() {
    this.delegate.query.apply(null, arguments);
    return this;
  }

  delete(url) {
    this.delegate.delete(url);
    return this;
  }

  patch(url, body) {
    this.delegate.patch(url, body);
    return this;
  }

  asResponse(cb) {
    const pending = this.delegate.asResponse();
    return Bluebird.resolve(pending).asCallback(cb);
  }

  asBody(cb) {
    const pending = this.delegate.asBody();
    return Bluebird.resolve(pending).asCallback(cb);
  }
}

module.exports = () => new CallbackWrapper(HttpTransport.createClient());
