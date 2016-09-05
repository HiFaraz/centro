'use strict';
exports = module.exports = function(options) {
  // expected output: happy belated 30th birthday
  this.promisify('myEvent', options.message)
    .then(message => console.log(options.message, message.join(' ')))
    .catch(error => console.error(error));
};
