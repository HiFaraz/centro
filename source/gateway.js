'use strict';
const debug = require('debug')('centro:gateway');

module.exports = function(doc) {
  debug('entered plugin', doc.info.title);

  Object.keys(doc.paths)
    .forEach((path) => {
      Object.keys(doc.paths[path])
        .forEach((method) => {
          const service = doc.paths[path][method]['x-service'];
          debug('new endpoint', method, '\'' + convertPath(path) + '\'', service);
          this.promisify('server:' + method, convertPath(path), service)
            .then(value => debug('success', value))
            .catch(error => debug('fail', error));
        });
    });
};

function convertPath(path) {
  const matches = path.match(/\{(.*?)\}/g);
  let newPath = path;

  if (matches) {
    matches.forEach(function(match) {
      newPath = newPath.replace(match, ':' + match.replace(/[{}]/g, ''));
    });
  }
  return newPath;
}
