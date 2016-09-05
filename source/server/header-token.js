'use strict';
const debug = require('debug')('centro:server:header-token');

// returns an express middleware function
module.exports = function extractTokenFromHeader(request, response, next) {
  const authorizationHeader = request.headers.authorization;
  parseAuthorizationHeader(authorizationHeader, handleTokenResponse);

  function handleTokenResponse(error, token) {
    if (error) {
      debug('request does not have a token', error);
      request.tokenError = error;
    } else {
      request.token = token;
      debug('request has a token', token);
    }
    next();
  }
};

function parseAuthorizationHeader(authorizationHeader, callback) {
  function resolve(token) {
    callback(null, token);
  }

  function reject(error) {
    callback(error);
  }
  const bearerTokenPrefix = (authorizationHeader) ? authorizationHeader.split(' ')[0] : '';
  const bearerToken = (authorizationHeader) ? authorizationHeader.split(' ')[1] : undefined;
  const hasAuthorizationHeader = typeof authorizationHeader !== 'undefined';
  const authorizationHeaderHasValidFormat = bearerTokenPrefix == 'Bearer' && typeof bearerToken !== 'undefined';

  if (hasAuthorizationHeader && authorizationHeaderHasValidFormat) resolve(bearerToken);
  else if (hasAuthorizationHeader) reject('Authorization header is malformed, should be in the form of: Bearer token');
  else reject('No authorization header found');
}
