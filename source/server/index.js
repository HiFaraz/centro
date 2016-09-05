'use strict';
const bodyParser = require('body-parser');
const debug = require('debug')('centro:server');
const express = require('express');
const headerToken = require('./header-token');
const httpCodes = require('http-codes');
const helmet = require('helmet');
const toobusy = require('toobusy-js');

module.exports = function server(configuration) {
  debug('entered plugin');
  const app = express();
  addGeneralMiddleware(app);
  configure(app);
  const server = new createServer(app, configuration);

  const endpoints = require('./endpoints');
  this.use(endpoints, app);

  this.add('server:start', (callback) => {
    const port = server.start();
    callback(null, true);
    const startupTime = this.await('centro:timer');
    this.promisify('server:start:success', {
        port: port,
        startupTime: startupTime
      })
      .catch(() => {});
  });
  this.add('server:shutdown', (callback) => {
    server.shutdown();
    callback(null, true);
  });
};

function addGeneralMiddleware(app) {
  app.use((request, response, next) => {
    if (toobusy()) response.sendStatus(httpCodes.SERVICE_UNAVAILABLE);
    else next();
  });
  app.use(bodyParser.json());
  app.use(helmet());
  app.use(headerToken);
}

function configure(app) {
  app.disable('x-powered-by');
}

function createServer(app, configuration) {
  this.running = false;

  const gracefulShutdown = () => {
    if (this.running) {
      debug('stop:attempt');
      this.server.close(() => {
        debug('stop:success');
        this.running = false;
        process.exit();
      });
      setTimeout(function() {
        debug('stop:forced', 'could not close connections in time, forcefully shutting down');
        this.running = false;
        process.exit();
      }, configuration.timeout);
    }
  };

  const start = () => {
    debug('start:attempt');
    this.server = app.listen(process.env.PORT || configuration.port);
    this.running = true;
    debug('start:success', 'PORT', this.server.address()
      .port);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    return this.server.address()
      .port;
  };

  return {
    start: start,
    shutdown: gracefulShutdown,
  };
}
