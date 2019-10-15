import { DependencyInjectionError } from './DependencyInjectionError';
import { ServiceReference } from './ServiceReference';
import { FunctionParser } from './FunctionParser';
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
export type ClassDefinition = Function
export type FactoryFunction = (service_container: ServiceContainer) => any

type MethodCall = {
  method: string
  method_arguments: any[]
}
export type ConstructorArgument = string | ServiceReference

export class ServiceDefinition {
  private method_calls = [] as Array<MethodCall>;
  private _factory = null as FactoryFunction | null;
  private _autowire = false;
  private _tags = [] as string[];
  public _public = false;

  constructor(
    private class_definition: ClassDefinition | null = null,
    private constructor_arguments: ConstructorArgument[] = [],
  ) {
    if (this.class_definition && !this.class_definition.prototype) {
      throw new DependencyInjectionError(
        'service_definition_invalid_definition',
        'Invalid class definition.'
      );
    }
  }

  setFactory(factory_callback_function: FactoryFunction) {
    this._factory = factory_callback_function;
    // FIXME (derek) check if it accepts a single argument
    return this;
  }

  setAutowired(value: boolean) {
    this._autowire = value;
    return this;
  }

  setPublic(value: boolean) {
    this._public = value;
    return this;
  }

  setArguments(arguments_array: any[]) {
    this.constructor_arguments = arguments_array;
    return this;
  }

  setTags(tags: string[]) {
    this._tags = tags;
    return this;
  }

  addTag(tag: string) {
    this._tags.push(tag);
    return this;
  }

  addMethodCall(method: string, method_arguments: any[]) {
    this.method_calls.push({method, method_arguments});
    return this;
  }

  hasTag(tag: string) {
    return this._tags.includes(tag);
  }

  getClass() {
    return this.class_definition;
  }


  /**
   *
   */
  makeMaterializer() {
    const materializer = (service_container: ServiceContainer) => {
      if (this._factory) {
        return this._factory(service_container);
      }
      const class_definition = this.class_definition
      if (!class_definition) {
        throw new DependencyInjectionError(
          'missing_class_definition',
          `No class definition found.`
        )
      }

      // Bound constructor is a function that returns a "new [class_definition]" with the given constructor arguments
      const bound_constructor = function bound_constructor(class_definition: ClassDefinition, constructor_arguments: ConstructorArgument[]) {
        // https://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
        // The [null] is intentional and needed for for determining "this" which is not applicable in a constructor
        return new (Function.prototype.bind.apply(class_definition, ([null] as any).concat(constructor_arguments)));
      };

      const materialized_constructor_arguments = [] as any[];

      // Magical autowiring!
      if (this._autowire) {
        const parsed = (() => {
          try {
            return FunctionParser.parse(class_definition);
          } catch (err) {
            throw new DependencyInjectionError(
              'autowire_invalid_function_syntax',
              `Autowiring error for ${class_definition.name}; Class parsing failed with reason "${err.message}".`
            );
          }
        })();

        const constructor_parameter_names = parsed.argument_names;

        constructor_parameter_names.forEach((_constructor_parameter_name, index) => {
          // The way autowiring works is it searches for a service with the exact name of the parameter
          // It cannot do partials; autowiring is all-or-nothing. If one parameter needs to be declared that
          // is not a service id, then autowiring won't work at all and the service must be manually configured.
          if (!service_container.has(_constructor_parameter_name)) {
            throw new DependencyInjectionError(
              'autowire_unknown_service',
              `Autowiring error for ${class_definition.name}; constructor argument at index ${index} is named ` +
              `${_constructor_parameter_name} but no matching service was found.`
            );
          }
          materialized_constructor_arguments.push(service_container.get(_constructor_parameter_name));
        });
      }

      // Otherwise, we don't autowire and have to manually wire the constructor arguments
      else {
        if (class_definition.prototype.constructor.length !== this.constructor_arguments.length) {
          throw new DependencyInjectionError(
            'service_definition_invalid_argument_count',
            `Incorrect number of constructor arguments provided in Service Definition for ` +
            `${class_definition.name}; expected ${class_definition.prototype.constructor.length}, ` +
            `received ${this.constructor_arguments.length}.`
          );
        }
        this.constructor_arguments.forEach(arg => {
          materialized_constructor_arguments.push(
            (arg => {
              if (arg instanceof ServiceReference) {
                return service_container.get(arg.getServiceId());
              }
              return arg;
            })(arg)
          );
        });
      }

      const service = bound_constructor(class_definition, materialized_constructor_arguments);

      if (this.method_calls) {
        this.method_calls.forEach(({ method, method_arguments }) => {
          const materialized_arguments = method_arguments.map(arg => {
            return ((arg) => {
              if (arg instanceof ServiceReference) {
                return service_container.get(arg.getServiceId());
              }
              return arg;
            })(arg)
          });

          if ('function' !== typeof service[method]) {
            throw new DependencyInjectionError(
              'method_call_invalid_function_name',
              `Undefined method "${method}" specified with method call.`
            );
          }
          service[method].apply(service, materialized_arguments);
        });
      }

      return service;
    };
    return materializer;
  }
}
