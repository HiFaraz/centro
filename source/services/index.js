'use strict';
const asyncFunction = require('asyncawait/async');
const awaitFunction = require('asyncawait/await');
const debug = require('debug')('centro:services');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const yaml = require('js-yaml');

class ServiceRunner {
  constructor(parentPath, apiGateway, hasPersistence) {
    this.apiGateway = apiGateway;
    this.parentPath = parentPath;
    this.hasPersistence = hasPersistence;
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
    debug('api:attempt', apiPath);
    try {
      const doc = yaml.safeLoad(fs.readFileSync(path.join(this.parentPath, apiPath), 'utf8'));
      this.use(this.apiGateway, doc);
      debug('api:success', apiPath);
    } catch (e) {
      debug('api:fail', apiPath);
    }
    return this;
  }
  async(fun) {
    return asyncFunction(fun);
  }
  await (fun) {
    if (fun instanceof Promise) return awaitFunction(fun);
    else {
      const args = [...arguments];
      return awaitFunction(this.promisify.apply(this, args));
    }
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
    this.use(require('../start'), this.hasPersistence);
  }
  use(serviceGroup) {
    const args = [...arguments];
    args.shift();
    if (typeof serviceGroup === 'string' || serviceGroup instanceof String) {
      const serviceGroupPath = path.join(this.parentPath, serviceGroup);
      debug('plugin:attempt', serviceGroup);
      try {
        asyncify(require(serviceGroupPath), this, args)();
        debug('plugin:success', serviceGroup);
        this.api(serviceGroup, 'api.yaml');
      } catch (error) {
        debug('plugin:fail', serviceGroup);
        throw error;
      }
    } else if (typeof serviceGroup === 'function') {
      debug('plugin:attempt', (serviceGroup.name !== '') ? serviceGroup.name : 'anonymous function');
      asyncify(serviceGroup, this, args)();
      debug('plugin:success', (serviceGroup.name !== '') ? serviceGroup.name : 'anonymous function');
    } else throw 'plugin parameter must be either a function or a string that points to a module that can be loaded with require()';
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

module.exports = function(parentPath, apiGateway, hasPersistence) {
  return new ServiceRunner(parentPath, apiGateway, hasPersistence);
};
