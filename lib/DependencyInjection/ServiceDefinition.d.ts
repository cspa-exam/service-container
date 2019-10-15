import { ServiceReference } from './ServiceReference';
import { ServiceContainer } from './ServiceContainer';
/**
 * Additional feature ideas:
 *
 * 1) Tagging
 *
 *    Can add 0 or more tags to a service. Then later, you can search all services by tags.
 *
 *
 * 2) Aliases
 *
 *    Define aliases at definition-time instead of having to add them on later.
 *
 *
 * 3) Named Bindings
 *
 *    Define a named binding
 *
 *
 * 4) Private services
 *
 *    Cannot fetch them from the container.
 */
export declare type ClassDefinition = Function;
export declare type FactoryFunction = (service_container: ServiceContainer) => any;
export declare type ConstructorArgument = string | ServiceReference;
export declare class ServiceDefinition {
    private class_definition;
    private constructor_arguments;
    private method_calls;
    private _factory;
    private _autowire;
    private _tags;
    _public: boolean;
    constructor(class_definition?: ClassDefinition | null, constructor_arguments?: ConstructorArgument[]);
    setFactory(factory_callback_function: FactoryFunction): this;
    setAutowired(value: boolean): this;
    setPublic(value: boolean): this;
    setArguments(arguments_array: any[]): this;
    setTags(tags: string[]): this;
    addTag(tag: string): this;
    addMethodCall(method: string, method_arguments: any[]): this;
    hasTag(tag: string): boolean;
    getClass(): Function | null;
    /**
     *
     */
    makeMaterializer(): (service_container: ServiceContainer) => any;
}
