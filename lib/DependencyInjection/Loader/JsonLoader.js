"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ServiceReference_1 = require("../ServiceReference");
const DependencyInjectionError_1 = require("../DependencyInjectionError");
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
                }
                else {
                    this.container.set(_service_id, service_configuration);
                }
            }
            // Type 2: A constructor (aka any function)
            else if (typeof service_configuration === 'function') {
                this.container.autowire(_service_id, service_configuration);
            }
            // Type 3: A object configuration
            else if (typeof service_configuration === 'object') {
                // First, get alias out of the way
                if (service_configuration.alias) {
                    if (!service_configuration.alias.startsWith('@')) {
                        throw new DependencyInjectionError_1.DependencyInjectionError('json_loader_alias_invalid', 'The provided alias is not a service id');
                    }
                    this.container.alias(_service_id, service_configuration.alias.substring(1));
                }
                // Second, it's the constructor method
                else if (service_configuration.class) {
                    const autowire = (() => {
                        if ('autowire' in service_configuration) {
                            return !!service_configuration.autowire;
                        }
                        return true;
                    })();
                    const constructor = service_configuration.class;
                    const args = autowire ? null : service_configuration.args;
                    const tags = ('tags' in service_configuration) ? service_configuration.tags : [];
                    // Can either be an autowired or non-autowired constructor
                    const definition = (() => {
                        if (autowire) {
                            return this.container.autowire(_service_id, constructor);
                        }
                        else {
                            const args_array = (args || []).map(arg => {
                                return JsonLoader.stringOrServiceReference(arg);
                            });
                            return this.container.register(_service_id, constructor)
                                .setArguments(args_array);
                        }
                    })();
                    tags.forEach(tag => definition.addTag(tag));
                }
                // Third, use a factory
                else if (service_configuration.factory) {
                    const definition = this.container.registerFactory(_service_id, service_configuration.factory);
                    const tags = ('tags' in service_configuration) ? service_configuration.tags : [];
                    tags.forEach(tag => definition.addTag(tag));
                }
                else {
                    // Otherwise, invalid
                    throw new DependencyInjectionError_1.DependencyInjectionError('json_loader_invalid_object_configuration', `Your json configuration is invalid for service id: ${_service_id}.`);
                }
            }
            // Everything else. Could be bool or int or other random crap.
            else {
                this.container.set(_service_id, service_configuration);
            }
        });
    }
    static stringOrServiceReference(subject) {
        if (subject && (typeof subject === 'string') && subject.startsWith('@')) {
            return new ServiceReference_1.ServiceReference(subject.substring(1));
        }
        return subject;
    }
}
exports.JsonLoader = JsonLoader;
