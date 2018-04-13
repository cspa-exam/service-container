'use strict';

const ServiceDefinition = require('./ServiceDefinition');
const ServiceReference = require('./ServiceReference');

class ServiceContainer {
  constructor() {
    this.services = {};
    this.service_aliases = {};
    this.service_definitions = {};
    this.frozen = false;
    this.is_compiling = false;
    this.compilation_path = [];
  }

  /**
   *
   */
  autowire(service_id, class_definition) {
    return this._setDefinition(service_id, new ServiceDefinition(class_definition)).setAutowired(true);
  }

  /**
   * Explicitly set the service id to the given value.
   *
   * Bear in mind that using the explicit set() will set a real object into the container, which is
   * returned with any get() call. It does not register a definition, and this cannot be used to
   * with visibility, tags, or autowiring.
   */
  set(service_id, service) {
    return this._setService(service_id, service);
  }

  /**
   * @param {string} service_id
   * @param {constructor} class_definition
   *
   * @return {ServiceDefinition}
   */
  register(service_id, class_definition) {
    return this._setDefinition(service_id, new ServiceDefinition(class_definition));
  }

  /**
   * @param {string} service_id
   * @param {function} callable_service_factory  This function must accept 1 argument; a service container.
   *
   * @returns {ServiceDefinition}
   */
  registerFactory(service_id, callable_service_factory) {
    return this._setDefinition(service_id, new ServiceDefinition()).setFactory(callable_service_factory);
  }

  /**
   * Another way to use register() that allows you to specify ServiceDependencies without having to
   * instantiate your own and pass them to setArguments().
   *
   * @param {string} service_id
   * @param {constructor} class_definition
   * @param {Array.<string>} service_id_dependencies    An array of string service_ids
   * @returns {*}
   */
  registerSimple(service_id, class_definition, service_id_dependencies) {
    return this._setDefinition(service_id, new ServiceDefinition(class_definition)).setArguments(
      service_id_dependencies.map(id => new ServiceReference(id))
    );
  }

  /**
   * @param {string} service_alias
   * @param {string} original_service_id
   */
  alias(service_alias, original_service_id) {
    if (this.frozen) {
      throw new Error('ServiceContainer error: You may not register additional aliases once the service container is frozen!');
    }
    if (!(this.getServiceIds().includes(original_service_id))) {
      throw new Error(`ServiceContainer error: Cannot create alias for "${original_service_id}" as the original service doesn't exist!`);
    }
    if (service_alias in this.service_aliases) {
      throw new Error(`ServiceContainer error: Cannot register alias "${service_alias}" as that name is already taken.`);
    }

    this.service_aliases[service_alias] = original_service_id;
  }

  freeze() {
    this.frozen = true;
  }

  /**
   * Forces the materializing of every service in the container. This is useful for detecting
   * cyclical dependencies.
   */
  compile() {
    this.is_compiling = true;
    this.compilation_path = [];
    this.getServiceIds().forEach(service_id => {
      // try {
        this.get(service_id);
      // } catch (err) {
      //   throw new Error(`ServiceContainer error: Failed to compile on service '${service_id}' because: ${err}. Compilation path was: (${this.compilation_path.join(' -> ')})`);
      // }
    });
    this.freeze();
    this.is_compiling = false;
  }

  /**
   * Returns TRUE if the given service_id has been registered in this container. False otherwise.
   *
   * @param {string} service_id
   * @returns {boolean}
   */
  has(service_id) {
    return (service_id in this.services)
      || (service_id in this.service_aliases)
      || (service_id in this.service_definitions);
  }

  /**
   * Retrieves the service from the container.
   *
   * @param service_id
   * @returns {*}
   */
  get(service_id) {
    return this._doGet(service_id);
  }

  /**
   * Remember that this will not respect aliases!!
   *
   * @param service_id
   * @returns {*}
   */
  getDefinition(service_id) {
    if (service_id in this.service_definitions) {
      return this.service_definitions[service_id];
    }
    throw new Error(`No such definition found for "${service_id}".`);
  }

  /**
   * Returns an array of service ids corresponding to services that have the given service id
   *
   * @param tag
   * @returns {Array}
   */
  findTaggedServiceIds(tag) {
    const service_ids = [];
    Object.keys(this.service_definitions).forEach(id => {
      const definition = this.service_definitions[id];
      if (definition.hasTag(tag)) {
        service_ids.push(id);
      }
    });
    return service_ids;
  }

  addCompilerPass(compiler_pass) {
    compiler_pass.process(this);
  }

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
  getAll(service_ids) {
    const service_bundle = {};
    service_ids.forEach(id => {
      service_bundle.id = this.get(id);
    });
    return service_bundle;
  }

  getServiceIds() {
    return [...new Set([...Object.keys(this.services), ...Object.keys(this.service_aliases), ...Object.keys(this.service_definitions)])];
  }

  toString() {
    return JSON.stringify(this);
  }

  /**
   * @param service_id
   * @returns {*}
   * @private
   */
  _doGet(service_id) {
    if (this.is_compiling) {
      if (this.compilation_path.includes(service_id)) {
        this.compilation_path.push(service_id); // Add it in anyway so it illustrates the cycle
        throw new Error(`ServiceContainer Error: Cyclical service dependency detected on (${this.compilation_path.join(' -> ')})`);
      }
      this.compilation_path.push(service_id);
    }

    const service = (() => {
      if (service_id in this.services) {
        return this.services[service_id];
      }
      else if (service_id in this.service_aliases) {
        return this._doGet(this.service_aliases[service_id]);
      }
      else if (service_id in this.service_definitions) {
        const definition = this.service_definitions[service_id];
        return this.services[service_id] = definition.makeMaterializer()(this);
      } else {
        return null;
      }
    })();

    if (null !== service) {
      if (this.is_compiling) {
        this.compilation_path.pop(); // Jump out of this current copilation path
      }
      return service;
    }

    // No such service id was found. We optionally look through the list of ids and find one that's similar
    const keys = this.getServiceIds();
    if (!keys) {
      throw new Error(`Cannot fetch service because no services have been registered in this container!`);
    } else {
      let best_fit = null;
      let best_edit_distance = 99999999;
      keys.forEach(other_service_id => {
        const edit_distance = getEditDistance(service_id, other_service_id);
        if (edit_distance < best_edit_distance) {
          best_edit_distance = edit_distance;
          best_fit = other_service_id;
        }
      });
      throw new Error(`Service with given Id not found, did you actually mean "${best_fit}"?`);
    }
  }


  /**
   * @param {string} service_id
   * @param {ServiceDefinition} service_definition
   * @returns {ServiceDefinition}
   * @private
   */
  _setDefinition(service_id, service_definition) {
    if (this.frozen) {
      throw new Error('ServiceContainer error: You may not register additional services once the service container is frozen!');
    }
    if (service_id in this.services) {
      throw new Error(`ServiceContainer error: Attempted to register the same service Id, ${service_id}, multiple times!`);
    }
    return this.service_definitions[service_id] = service_definition;
  }

  /**
   * @param {string} service_id
   * @param {object} service
   * @returns {object}
   * @private
   */
  _setService(service_id, service) {
    if (this.frozen) {
      throw new Error('ServiceContainer error: You may not register additional services once the service container is frozen!');
    }
    if (service_id in this.services) {
      throw new Error(`ServiceContainer error: Attempted to register the same service Id, ${service_id}, multiple times!`);
    }

    return this.services[service_id] = service;
  }

}

module.exports = ServiceContainer;

// I pulled this off https://gist.github.com/andrei-m/982927 and didn't bother pulling in a new npm dependency
// due to its very specific use case
/*
Copyright (c) 2011 Andrei Mackenzie
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Compute the edit distance between the two given strings
function getEditDistance(a, b){
  if(a.length == 0) return b.length;
  if(b.length == 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
          Math.min(matrix[i][j-1] + 1, // insertion
            matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
}
