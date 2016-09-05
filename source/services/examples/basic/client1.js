'use strict';
module.exports = function() {
  this.add('myEvent', (message, callback) => {
    callback(null, message + ' world');
  });
};
