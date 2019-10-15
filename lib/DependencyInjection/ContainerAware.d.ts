import { ServiceContainer } from './ServiceContainer';
export declare class ContainerAware {
    container: ServiceContainer | undefined;
    setContainer(service_container: ServiceContainer): void;
    /**
     * FIXME (Derek) maybe we should avoid this get() method as it can collide with subclass get() methods?
     * Symfony just opts for a protected member `this.service_container`, maybe we can do that?
     */
    get(service_id: string): object | null;
}
