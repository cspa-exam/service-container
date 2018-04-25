'use strict';

const ServiceReference = require('../ServiceReference');

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
 *   constructor: Required. A reference to the object constructor/aka "class definition"
 *
 *   args:  Conditional. Array. An array of constructor arguments. It will automatically convert strings
 *          that begin with "@" to service id references. Only necessary with autowire: false
 *
 *   autowire:  Conditional. Boolean. When true, this service will autowire. Default is true.
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
class JsonLoader {
  constructor(service_container) {
    this.container = service_container;
  }

  load(json_structure) {
    Object.keys(json_structure).forEach(_service_id => {
      const service_configuration = json_structure[_service_id];

      // Type 1: A string
      if (typeof service_configuration === 'string') {
        if (service_configuration.startsWith('@')) {
          this.container.alias(_service_id, service_configuration.substring(1));
        } else {
          this.container.set(_service_id, service_configuration);
        }
      }

      // Type 2: A constructor (aka any function)
      else if (typeof service_configuration === 'function') {
        this.container.autowire(_service_id, service_configuration);
      }

      // Type 3: A object configuration
      else if (typeof service_configuration === 'object') {
        const autowire = (() => {
          if ('autowire' in service_configuration) {
            return !!service_configuration.autowire;
          }
          return true;
        })();
        const constructor = service_configuration.constructor;
        const args = autowire ? null : service_configuration.args;
        const tags = ('tags' in service_configuration) ? service_configuration.tags : [];

        const definition = (() => {
          if (autowire) {
            return this.container.autowire(_service_id, constructor);
          } else {
            const args_array = [];
            args.forEach(arg => {
              args_array.push(JsonLoader.stringOrServiceReference(arg));
            });

            return this.container.register(_service_id, constructor)
              .setArguments(args_array);
          }
        })();
        tags.forEach(tag => definition.addTag(tag));
      }

      // Everything else. Could be bool or int or other random crap.
      else {
        this.container.set(_service_id, service_configuration);
      }
    });
  }

  static stringOrServiceReference(string) {
    if (string && (typeof string === 'string') && string.startsWith('@')) {
      return new ServiceReference(string.substring(1));
    }
    return string;
  }
}
module.exports = JsonLoader;
