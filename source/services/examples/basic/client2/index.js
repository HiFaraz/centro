'use strict';
module.exports = function(options) {
  // expected output: hello world
  this.promisify('myEvent', options.message)
    .then(message => console.log(message))
    .catch(error => console.error(error));

  // this emitter is an orphan - it is calling out to a non-existent listener. It will return an error through the `catch` method
  // expected output: no service registered @ myOrphanEvent
  this.promisify('myOrphanEvent', options.message)
    .then(message => console.log(message))
    .catch(error => console.error(error));
};
