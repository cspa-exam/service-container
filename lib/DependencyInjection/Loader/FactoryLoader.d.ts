import { ServiceContainer } from "../ServiceContainer";
import { FactoryFunction } from "../ServiceDefinition";
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
export declare class FactoryLoader {
    container: ServiceContainer;
    constructor(service_container: ServiceContainer);
    load(factory_function: FactoryFunction): any;
}
