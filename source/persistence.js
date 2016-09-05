'use strict';
const debug = require('debug')('centro:persistence');
const Sequelize = require('sequelize');

module.exports = function persistence(configuration) {
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
    debug('sync:attempt');
    connection
      .sync({
        force: true
      })
      .then(() => {
        debug('sync:success');
        callback(null, true);
        this.promisify('persistence:sync:success')
          .catch(() => {});
      })
      .catch((error) => {
        debug('sync:fail', error);
        callback(error);
      });
  });

  this.add('persistence:authenticate', (callback) => {
    debug('authenticate:attempt');
    connection
      .authenticate()
      .then(() => {
        debug('authenticate:success');
        callback(null, true);
        this.promisify('persistence:authenticate:sucess')
          .catch(() => {});
      })
      .catch((error) => {
        debug('authenticate:fail', error);
        callback(error);
      });
  });

  this.add('persistence:shutdown', gracefulShutdown);

  function gracefulShutdown() {
    debug('shutdown:attempt');
    connection.close();
  }

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};
