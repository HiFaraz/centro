'use strict';
exports = module.exports = function() {
  // this is the first listener
  this.add('myEvent', (message, callback) => {
    callback(null, 'belated');
  });

  // this is the second listener. It precedes the first listener, which is provided as the `previous` argument
  this.add('myEvent', (message, callback) => {
    callback(null, '30th');
  });

  // this is the third listener. It precedes the second listener, which is provided as the `previous` argument
  this.add('myEvent', (message, callback) => {
    callback(null, 'belated');
  });
};
