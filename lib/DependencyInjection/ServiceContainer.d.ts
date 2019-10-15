import { ServiceDefinition, ClassDefinition, FactoryFunction, ConstructorArgument } from './ServiceDefinition';
import { CompilerPass } from './CompilerPass';
export declare type ServiceDef = string | FactoryFunction | ExplicitServiceConfig;
declare type ExplicitServiceConfig = {
    args: ConstructorArgument[];
    autowire: boolean;
    tags?: string[];
    class?: ClassDefinition;
    alias?: string;
    factory?: FactoryFunction;
};
export declare class ServiceContainer {
    private services;
    private service_aliases;
    private service_definitions;
    private frozen;
    private is_compiling;
    private compilation_path;
    constructor();
    /**
     *
     */
    autowire(service_id: string, class_definition: ClassDefinition): ServiceDefinition;
    /**
     * Explicitly set the service id to the given value.
     *
     * Bear in mind that using the explicit set() will set a real object into the container, which is
     * returned with any get() call. It does not register a definition, and this cannot be used to
     * with visibility, tags, or autowiring.
     */
    set(service_id: string, service: ServiceDef): ServiceDef;
    /**
     * @param {string} service_id
     * @param {constructor} class_definition
     *
     * @return {ServiceDefinition}
     */
    register(service_id: string, class_definition: ClassDefinition): ServiceDefinition;
    /**
     * @param {string} service_id
     * @param {function} callable_service_factory  This function must accept 1 argument; a service container.
     *
     * @returns {ServiceDefinition}
     */
    registerFactory(service_id: string, callable_service_factory: FactoryFunction): ServiceDefinition;
    /**
     * Another way to use register() that allows you to specify ServiceDependencies without having to
     * instantiate your own and pass them to setArguments().
     *
     * @param {string} service_id
     * @param {constructor} class_definition
     * @param {Array.<string>} service_id_dependencies    An array of string service_ids
     * @returns {*}
     */
    registerSimple(service_id: string, class_definition: ClassDefinition, service_id_dependencies: string[]): ServiceDefinition;
    /**
     * @param {string} service_alias
     * @param {string} original_service_id
     */
    alias(service_alias: string, original_service_id: string): void;
    freeze(): void;
    /**
     * Forces the materializing of every service in the container. This is useful for detecting
     * cyclical dependencies.
     */
    compile(): void;
    /**
     * Returns TRUE if the given service_id has been registered in this container. False otherwise.
     *
     * @param {string} service_id
     * @returns {boolean}
     */
    has(service_id: string): boolean;
    /**
     * Retrieves the service from the container.
     *
     * @param service_id
     * @returns {*}
     */
    get(service_id: string): object | null;
    /**
     * Remember that this will not respect aliases!!
     *
     * @param service_id
     * @returns {*}
     */
    getDefinition(service_id: string): ServiceDefinition;
    /**
     * Returns an array of service ids corresponding to services that have the given service id
     *
     * @param tag
     * @returns {Array}
     */
    findTaggedServiceIds(tag: string): string[];
    addCompilerPass(compiler_pass: CompilerPass): void;
    /**
     * Convenience method for getting a bunch of services. Returns an associative array with all of the materialized
     * services, keyed by their service id
     *
     * This is made easy with aliases:
     *
     *   const {
     *     ServiceA, ServiceB, ServiceC
     *   } = container.getAll(['ServiceA', 'ServiceB', 'ServiceC']);
     */
    getAll(service_ids: string[]): {
        [servide_id: string]: object;
    };
    getServiceIds(): string[];
    toString(): string;
    /**
     * @param service_id
     * @returns {*}
     * @private
     */
    _doGet(service_id: string): object | null;
    /**
     * @param {string} service_id
     * @param {ServiceDefinition} service_definition
     * @returns {ServiceDefinition}
     * @private
     */
    _setDefinition(service_id: string, service_definition: ServiceDefinition): ServiceDefinition;
    /**
     * @param {string} service_id
     * @param {object} service
     * @returns {object}
     * @private
     */
    _setService(service_id: string, service: ServiceDef): ServiceDef;
}
export {};
