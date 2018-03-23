'use strict';

const DependencyInjectionError = require('./DependencyInjectionError');
const ServiceContainer = require('./ServiceContainer');

class ContainerAware {
  setContainer(service_container) {

    // FIXME (derek)
    // so the deal is, it is entirely possible for a module that includes service-container to require a different
    // version than the base project. If the first module extends ContainerAware with a service, that ContainerAware
    // will actually have a DIFFERENT definition of "S-e-r-v-i-c-e-C-o-n-t-a-i-n-e-r"   wtfbbq
    // I guess the way to fix this is to make both of these repos "pure" and to create a 3rd repo that acts as a glue
    // or something... sigh

    // if (!(service_container instanceof ServiceContainer)) {
    //   throw new DependencyInjectionError('container_aware_invalid_container', 'Invalid container.');
    // }
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
