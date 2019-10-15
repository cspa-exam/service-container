"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DependencyInjectionError_1 = require("./DependencyInjectionError");
const ServiceContainer_1 = require("./ServiceContainer");
class ContainerAware {
    setContainer(service_container) {
        if (!(service_container instanceof ServiceContainer_1.ServiceContainer)) {
            throw new DependencyInjectionError_1.DependencyInjectionError('container_aware_invalid_container', 'Invalid container.');
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
exports.ContainerAware = ContainerAware;
