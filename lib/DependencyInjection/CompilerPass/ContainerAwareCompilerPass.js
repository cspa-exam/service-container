"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CompilerPass_1 = require("../CompilerPass");
const ContainerAware_1 = require("../ContainerAware");
class ContainerAwareCompilerPass extends CompilerPass_1.CompilerPass {
    process(service_container) {
        const ids = service_container.findTaggedServiceIds('container_aware');
        ids.forEach(id => {
            const definition = service_container.getDefinition(id);
            if (definition.getClass().prototype instanceof ContainerAware_1.ContainerAware) {
                definition.addMethodCall('setContainer', [service_container]);
            }
            else {
                // Silently do nothing
            }
        });
    }
}
exports.ContainerAwareCompilerPass = ContainerAwareCompilerPass;
