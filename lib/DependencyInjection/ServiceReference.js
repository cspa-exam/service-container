'use strict';

class ServiceReference {
  constructor(service_id) {
    this.service_id = service_id;
  }

  getServiceId() {
    return this.service_id;
  }
}

module.exports = ServiceReference;
