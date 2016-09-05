'use strict';
const debug = require('debug')('centro:server/endpoints');
const httpCodes = require('http-codes');
const merge = require('lodash.merge');

module.exports = function endpoints(app) {
  debug('entered plugin');

  ['checkout', 'copy', 'delete', 'get', 'head', 'lock', 'merge', 'mkactivity', 'mkcol', 'move', 'm-search', 'notify', 'options', 'patch', 'post', 'purge', 'put', 'report', 'search', 'subscribe', 'trace', 'unlock', 'unsubscribe'].forEach(method => this.add('server:' + method, (path, service) => this.promisify('server:endpoint', method, path, service)));

  this.add('server:endpoint', (method, path, service, callback) => {
    debug('adding endpoint', method, '\'' + path + '\'', 'consumes', '\'' + service + '\'');
    app[method](path, (request, response) => {
      this.promisify('server:endpointHandler', service, request, response)
        .then(value => callback(null, value))
        .catch(error => callback(error));
    });
  });

  this.add('server:endpointHandler', (service, request, response, callback) => {
    function resolve(data, code = httpCodes.OK) {
      debug('request resolved', {
        code: code,
        data: data
      });
      if (data || data == 0) response
        .status(code)
        .send(data);
      else response.sendStatus(code);
      callback(null, {
        code: code,
        data: data
      });
    }

    function reject(code = null, data = null) {
      if (!code) code = httpCodes.INTERNAL_SERVER_ERROR;
      debug('request rejected', {
        code: code,
        data: data
      });
      if (data) response
        .status(code)
        .send(data);
      else response.sendStatus(code);
      callback({
        code: code,
        data: data
      }, null);
    }

    try {
      const serviceResponse = this.await(service, merge({}, request.params, request.body), request.token);
      resolve(serviceResponse.data, serviceResponse.code);
    } catch (error) {
      debug(error);
      reject(error.code, error.data);
    }
  });
};
