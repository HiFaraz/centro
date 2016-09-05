'use strict';
const services = require('../../');
services
  .use('client1')
  .use('client2', {
    message: 'happy'
  });
