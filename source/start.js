'use strict';
const debug = require('debug')('centro:start');

exports = module.exports = function start() {
  debug('entered plugin');
  try {
    this.await('persistence:authenticate');
    try {
      this.await('models:define');
    } catch (error) {
      debug('models:define:error', error);
    }
    this.await('server:start');
  } catch (error) {
    debug('error in starting app', error);
    this.promisify('server:shutdown');
    this.promisify('persistence:shutdown');
    process.kill(process.pid, 'SIGTERM');
  }
};
