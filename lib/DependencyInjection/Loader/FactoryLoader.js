'use strict';

/**
 * This form of container building loader simply is passed a function. The function must accept a single
 * argument that is the service container, and the function must do all the container configuration itself.
 *
 * Recommended usage:
 *
 *  const loader = new FactoryLoader(service_container);
 *  loader.load(require('./some_container_file'));
 *
 *  -- some_container_file.js --
 *  module.exports = service_container => {
 *    service_container.register( // ... );
 *  }
 */
class FactoryLoader {
  constructor(service_container) {
    this.container = service_container;
  }

  load(factory_function) {
    return factory_function(this.container);
  }
}
module.exports = FactoryLoader;
