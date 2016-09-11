'use strict';
const timer = require('./timer');
const debug = require('debug')('centro:index');
const path = require('path');
const parentPath = path.dirname(module.parent.filename);
const gateway = require('./gateway');
const persistence = require('./persistence');
const server = require('./server');

module.exports = function(configuration) {
  const hasPersistence = (typeof configuration.persistence !== 'undefined');
  const services = require('./services')(parentPath, gateway, hasPersistence);
  debug('start');
  services
    .use(timer)
    .use(server, configuration.server);
  if (hasPersistence) services.use(persistence, configuration.persistence);
  return services;
};
