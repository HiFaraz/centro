'use strict';
const debug = require('debug')('centro:start');

exports = module.exports = function start(hasPersistence) {
  debug('entered plugin', hasPersistence);
  try {
    if (hasPersistence) this.await('persistence:authenticate');
    this.await('server:start');
  } catch (error) {
    debug('error in starting app', error);
    this.promisify('server:shutdown');
    if (hasPersistence) this.promisify('persistence:shutdown');
    process.kill(process.pid, 'SIGTERM');
  }
};
