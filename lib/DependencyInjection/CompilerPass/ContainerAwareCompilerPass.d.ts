import { CompilerPass } from '../CompilerPass';
import { ServiceContainer } from '../ServiceContainer';
export declare class ContainerAwareCompilerPass extends CompilerPass {
    process(service_container: ServiceContainer): void;
}
