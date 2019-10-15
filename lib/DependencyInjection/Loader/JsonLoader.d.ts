import { ServiceContainer, ServiceDef } from '../ServiceContainer';
import { ConstructorArgument } from '../ServiceDefinition';
/**
 * This class provides an alternative method of loading to FactoryLoader. The JSON Loader is a feature-constrained
 * version of the FactoryLoader that encourages configuration that uses less execution of arbitrary code. This
 * improves testability and better segments code.
 *
 * The input to the load function should be a json structure:
 *
 * {
 *   service_id_1: <service configuration>,
 *   service_id_2: <service configuration>,
 *   service_id_3: <service configuration>,
 * }
 *
 * --
 * Each individual service configuration should be an object with the following keys:
 *
 *   (originally... constructor. Cannot use that because it's a object reserved word)
 *   class: Conditional. A reference to the object constructor/aka "class definition". Required if
 *          factory is omitted.
 *
 *   factory: Conditional. A reference to a function that returns the service. EITHER provide a constructor
 *            OR a factory, not both.
 *
 *            By default, when args: is omitted, the container will provide ITSELF as the first and only
 *            argument to the factory function.
 *
 *   args:  Conditional. Array. An array of constructor arguments. It will automatically convert strings
 *          that begin with "@" to service id references. Only necessary with autowire: false
 *
 *   autowire:  Conditional. Only applicable with constructor. Boolean. When true, this service will autowire.
 *              Default is true.
 *
 *   tags: Optional. Array of strings. Tags to add to this definition.
 *
 *   alias: Optional. A string, beginning with '@'. If this is provided, it will disregard all other options.
 *          It will alias the current service id to another service whose id is equal to this string (minus the @)
 *
 * --
 * ALTERNATIVELY, you may pass a string or a constructor to the value of <service configuration>
 *
 *   A string:  If the value is a string, starting with '@', it will assume an alias is requested. It will
 *              alias the current service id to another service whose id is equal to this string (minus the @)
 *
 *              Example:
 *
 *                {
 *                  my_service_alias: '@other_service_id',
 *                }
 *
 *   An object constructor:
 *              If the value provided is an object constructor, then it will register an autowired service with
 *              the given constructor. It will have no tags.
 *
 *              Example:
 *
 *                {
 *                  ['my.service.id']: require('./MyServiceClassFile'),
 *                }
 *
 */
declare type JsonStructure = {
    [service_id: string]: ServiceDef;
};
export declare class JsonLoader {
    container: ServiceContainer;
    constructor(service_container: ServiceContainer);
    load(json_structure: JsonStructure): void;
    static stringOrServiceReference(subject: ConstructorArgument): ConstructorArgument;
}
export {};
