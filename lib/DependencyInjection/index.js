'use strict';

const CompilerPass = require('./CompilerPass');
const ContainerAware = require('./ContainerAware');
const ServiceContainer = require('./ServiceContainer');
const ServiceDefinition = require('./ServiceDefinition');
const ServiceReference = require('./ServiceReference');

module.exports = {
  CompilerPass,
  ContainerAware,
  ServiceContainer,
  ServiceDefinition,
  ServiceReference,

  FactoryLoader: require('./Loader/FactoryLoader'),
  JsonLoader: require('./Loader/JsonLoader'),
};
