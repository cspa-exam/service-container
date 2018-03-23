'use strict';

const DependencyInjectionError = require('./DependencyInjectionError');
const ServiceReference = require('./ServiceReference');
const FunctionParser = require('./FunctionParser');

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
class ServiceDefinition {
  constructor(class_definition = null, constructor_arguments = []) {
    this.class = class_definition;
    if (class_definition && !this.class.prototype) {
      throw new DependencyInjectionError(
        'service_definition_invalid_definition',
        'Invalid class definition.'
      );
    }
    this.constructor_arguments = constructor_arguments || [];
    this.method_calls = [];
    this._factory = null;
    this._autowire = false;
    this._public = false;
    this._tags = [];
  }

  setFactory(factory_callback_function) {
    this._factory = factory_callback_function;
    // FIXME (derek) check if it accepts a single argument
    return this;
  }

  setAutowired(value) {
    this._autowire = value;
    return this;
  }

  setPublic(value) {
    this._public = value;
    return this;
  }

  setArguments(arguments_array) {
    this.constructor_arguments = arguments_array;
    return this;
  }

  setTags(tags) {
    this._tags = tags;
    return this;
  }

  addTag(tag) {
    this._tags.push(tag);
    return this;
  }

  addMethodCall(method, method_arguments) {
    this.method_calls.push({method, method_arguments});
    return this;
  }

  hasTag(tag) {
    return this._tags.includes(tag);
  }

  getClass() {
    return this.class;
  }


  /**
   *
   */
  makeMaterializer() {
    const materializer = (service_container) => {
      if (this._factory) {
        return this._factory(service_container);
      }

      // Bound constructor is a function that returns a "new [class_definition]" with the given constructor arguments
      const bound_constructor = function bound_constructor(class_definition, constructor_arguments) {
        // https://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
        // The [null] is intentional and needed for for determining "this" which is not applicable in a constructor
        return new (Function.prototype.bind.apply(class_definition, [null].concat(constructor_arguments)));
      };

      const materialized_constructor_arguments = [];

      // Magical autowiring!
      if (this._autowire) {
        const parsed = (() => {
          try {
            return FunctionParser.parse(this.class);
          } catch (err) {
            throw new DependencyInjectionError(
              'autowire_invalid_function_syntax',
              `Autowiring error for ${this.class.name}; Class parsing failed with reason "${err.message}".`
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
              `Autowiring error for ${this.class.name}; constructor argument at index ${index} is named ` +
              `${_constructor_parameter_name} but no matching service was found.`
            );
          }
          materialized_constructor_arguments.push(service_container.get(_constructor_parameter_name));
        });
      }

      // Otherwise, we don't autowire and have to manually wire the constructor arguments
      else {
        if (this.class.prototype.constructor.length !== this.constructor_arguments.length) {
          throw new DependencyInjectionError(
            'service_definition_invalid_argument_count',
            `Incorrect number of constructor arguments provided in Service Definition for ` +
            `${this.class.name}; expected ${this.class.prototype.constructor.length}, ` +
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

      const service = bound_constructor(this.class, materialized_constructor_arguments);

      if (this.method_calls) {
        this.method_calls.forEach(({ method, method_arguments }) => {
          const materialized_arguments = [];
          method_arguments.forEach(arg => {
            materialized_arguments.push(
              ((arg) => {
                if (arg instanceof ServiceReference) {
                  return service_container.get(arg.getServiceId());
                }
                return arg;
              })(arg)
            );
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

module.exports = ServiceDefinition;
