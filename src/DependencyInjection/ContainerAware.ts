import { DependencyInjectionError } from './DependencyInjectionError';
import { ServiceContainer } from './ServiceContainer';

export class ContainerAware {
  container: ServiceContainer | undefined
  setContainer(service_container: ServiceContainer) {
    if (!(service_container instanceof ServiceContainer)) {
      throw new DependencyInjectionError('container_aware_invalid_container', 'Invalid container.');
    }
    this.container = service_container;
  }

  /**
   * FIXME (Derek) maybe we should avoid this get() method as it can collide with subclass get() methods?
   * Symfony just opts for a protected member `this.service_container`, maybe we can do that?
   */
  get(service_id: string) {
    return this.container!.get(service_id);
  }
}
