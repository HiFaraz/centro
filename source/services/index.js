'use strict';
const asyncFunction = require('asyncawait/async');
const awaitFunction = require('asyncawait/await');
const debug = require('debug')('centro:services');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const yaml = require('js-yaml');

class ServiceRunner {
  constructor(parentPath, apiGateway) {
    this.apiGateway = apiGateway;
    this.parentPath = parentPath;
    this.services = new Object();
  }
  add(serviceName, handler) {
    if (typeof(handler) !== 'function') throw 'handler is not a function';
    else if (!this.hasHandler(serviceName)) this.services[serviceName] = handler;
    else if (Array.isArray(this.services[serviceName])) this.services[serviceName].push(handler);
    else this.services[serviceName] = [this.services[serviceName], handler];
  }
  api() {
    const apiPath = path.join.apply(this, [...arguments]);
    debug('attempt api load', apiPath);
    try {
      const doc = yaml.safeLoad(fs.readFileSync(path.join(this.parentPath, apiPath), 'utf8'));
      this.use(this.apiGateway, doc);
      debug('success');
    } catch (e) {
      debug('fail');
    }
    return this;
  }
  await () {
    const args = [...arguments];
    return awaitFunction(this.promisify.apply(this, args));
  }
  promisify(serviceName) {
    const args = [...arguments];
    args.shift();
    if (!this.hasHandler(serviceName)) return Promise.reject('no service registered @ ' + serviceName);
    else {
      if (Array.isArray(this.services[serviceName])) return Promise.all(this.services[serviceName].map(handler => convert(handler)));
      else return convert(this.services[serviceName]);
    }

    function convert(handler) {
      return Promise.promisify(
          function() {
            const promisedArgs = [...arguments];
            asyncify(handler, this, promisedArgs)();
          }
        )
        .apply(this, args);
    }
  }
  hasHandler(serviceName) {
    return this.services.hasOwnProperty(serviceName);
  }
  start() {
    this.use(require('../start'));
  }
  use(serviceGroup) {
    const args = [...arguments];
    args.shift();
    if (typeof serviceGroup === 'string' || serviceGroup instanceof String) {
      const serviceGroupPath = path.join(this.parentPath, serviceGroup);
      debug('plugin load attempt', serviceGroupPath);
      try {
        asyncify(require(serviceGroupPath), this, args)();
        debug('success');
        this.api(serviceGroup, 'api.yaml');
      } catch (error) {
        debug('fail: ' + serviceGroup);
        throw error;
      }
    } else asyncify(serviceGroup, this, args)();
    return this;
  }
}

function asyncify(fun, context, args) {
  return asyncFunction(bind(fun, context, args));
}

function bind(fun, context, args) {
  return function bound() {
    return fun.apply(context, args);
  };
}

module.exports = function(parentPath, apiGateway) {
  return new ServiceRunner(parentPath, apiGateway);
};
