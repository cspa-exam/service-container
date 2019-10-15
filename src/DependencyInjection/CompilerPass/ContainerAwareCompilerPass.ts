import { CompilerPass } from '../CompilerPass';
import { ContainerAware } from '../ContainerAware';
import { ServiceContainer } from '../ServiceContainer';

export class ContainerAwareCompilerPass extends CompilerPass {
  process(service_container: ServiceContainer) {
    const ids = service_container.findTaggedServiceIds('container_aware');

    ids.forEach(id => {
      const definition = service_container.getDefinition(id);

      if (definition.getClass()!.prototype instanceof ContainerAware) {
        definition.addMethodCall('setContainer', [ service_container ]);
      } else {
        // Silently do nothing
      }
    })
  }
}
