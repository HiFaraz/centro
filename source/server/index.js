'use strict';
const bodyParser = require('body-parser');
const debug = require('debug')('centro:server');
const express = require('express');
const headerToken = require('./header-token');
const httpCodes = require('http-codes');
const helmet = require('helmet');
const toobusy = require('toobusy-js');

module.exports = function(configuration) {
  debug('entered plugin');
  const app = express();
  addGeneralMiddleware(app);
  configure(app);
  const server = new createServer(app, configuration);

  const endpoints = require('./endpoints');
  this.use(endpoints, app);

  this.add('server:start', (callback) => {
    server.start();
    callback(null, true);
    this.promisify('server:started');
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
      debug('stopping');
      this.server.close(() => {
        debug('stopped');
        this.running = false;
        process.exit();
      });
      setTimeout(function() {
        debug('could not close connections in time, forcefully shutting down');
        this.running = false;
        process.exit();
      }, configuration.timeout);
    }
  };

  const start = () => {
    debug('starting');
    this.server = app.listen(process.env.PORT || configuration.port);
    this.running = true;
    debug('started at port', this.server.address()
      .port);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  };

  return {
    start: start,
    shutdown: gracefulShutdown,
  };
}
