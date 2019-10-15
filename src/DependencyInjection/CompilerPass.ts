import { DependencyInjectionError } from './DependencyInjectionError';
import { ServiceContainer } from './ServiceContainer';

export class CompilerPass {

  process(_service_container: ServiceContainer) {
    // Fill me in!
    throw new DependencyInjectionError('not_implemented', 'Not implemented!');
  }

}
