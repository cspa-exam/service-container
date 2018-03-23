'use strict';

const CompilerPass = require('../CompilerPass');
const ContainerAware = require('../ContainerAware');

class ContainerAwareCompilerPass extends CompilerPass {
  process(service_container) {
    const ids = service_container.findTaggedServiceIds('container_aware');

    ids.forEach(id => {
      const definition = service_container.getDefinition(id);

      if (definition.getClass().prototype instanceof ContainerAware) {
        definition.addMethodCall('setContainer', [ service_container ]);
      } else {
        // Silently do nothing
      }
    })
  }
}
module.exports = ContainerAwareCompilerPass;
