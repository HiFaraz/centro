'use strict';
const debug = require('debug')('centro:persistence');
const Sequelize = require('sequelize');

module.exports = function(configuration) {
  debug('entered plugin');
  const connection = new Sequelize(configuration.name, configuration.username, configuration.password, {
    logging: false,
    dialect: configuration.type,
    host: configuration.host,
    port: configuration.port
  });

  this.add('persistence:require', (callback) => {
    callback(null, {
      orm: Sequelize,
      connection: connection
    });
  });

  this.add('persistence:sync', (callback) => {
    debug('syncing');
    connection
      .sync({
        force: true
      })
      .then(() => {
        debug('synced');
        callback(null, true);
        this.promisify('persistence:synced');
      })
      .catch((error) => {
        debug('cannot sync to database', error);
        callback(error);
      });
  });

  this.add('persistence:authenticate', (callback) => {
    debug('authenticating');
    connection
      .authenticate()
      .then(() => {
        debug('authenticated');
        callback(null, true);
        this.promisify('persistence:authenticated');
      })
      .catch((error) => {
        debug('cannot authenticate to database', error);
        callback(error);
      });
  });

  this.add('persistence:shutdown', gracefulShutdown);

  function gracefulShutdown() {
    debug('closing');
    connection.close();
  }

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};
