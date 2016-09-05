'use strict';
const debug = require('debug')('centro:timer');

debug('timer:start');
const start = process.hrtime();

module.exports = function timer() {
  debug('entered plugin');
  this.add('centro:timer', (callback) => {
    const end = process.hrtime(start);
    debug('timer:end', end);
    callback(null, end);
  });
};
