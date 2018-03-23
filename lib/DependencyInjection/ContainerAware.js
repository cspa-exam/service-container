'use strict';

const DependencyInjectionError = require('./DependencyInjectionError');

class ContainerAware {
  setContainer(service_container) {
    let ServiceContainer = null;
    try {
      ServiceContainer = require('./ServiceContainer');
    } catch (error) {

    }


    if (!(service_container instanceof ServiceContainer)) {
      throw new DependencyInjectionError('Invalid container.');
    }
    this.container = service_container;
  }

  /**
   * FIXME (Derek) maybe we should avoid this get() method as it can collide with subclass get() methods?
   * Symfony just opts for a protected member `this.service_container`, maybe we can do that?
   */
  get(service_id) {
    return this.container.get(service_id);
  }
}
module.exports = ContainerAware;
