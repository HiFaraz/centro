'use strict';
const debug = require('debug')('centro:gateway');

module.exports = function gateway(doc) {
  debug('entered plugin', doc.info.title);

  const apiDocServiceName = 'gateway:api:' + doc.host + doc.basePath;

  this.add(apiDocServiceName, (data, token, callback) => {
    callback(null, {
      data: doc
    });
  });

  this.promisify('server:get', ('/api-documentation' + doc.basePath), apiDocServiceName)
    .then(value => debug('success', value))
    .catch(error => debug('fail', error));

  debug('new endpoint', 'get', '\'/api-documentation ' + doc.basePath + '\'', '=>', apiDocServiceName);

  Object.keys(doc.paths)
    .forEach((path) => {
      Object.keys(doc.paths[path])
        .forEach((method) => {
          const service = method.toLowerCase() + path;
          const newPath = ((doc.basePath.slice(-1) == '/') ? doc.basePath.slice(0, -1) : doc.basePath) + convertPath(path);
          debug('new endpoint', method, '\'' + newPath + '\'', '=>', service);
          this.promisify('server:' + method, newPath, service)
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
