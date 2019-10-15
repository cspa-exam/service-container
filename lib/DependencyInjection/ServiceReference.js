"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * When this class is passed as one of the arguments to a ServiceDefinition#setArguments(), it is converted
 * to a service with the given service_id when the ServiceDefinition is instantiated.
 */
class ServiceReference {
    constructor(service_id) {
        this.service_id = service_id;
    }
    getServiceId() {
        return this.service_id;
    }
}
exports.ServiceReference = ServiceReference;
