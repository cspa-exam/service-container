/**
 * When this class is passed as one of the arguments to a ServiceDefinition#setArguments(), it is converted
 * to a service with the given service_id when the ServiceDefinition is instantiated.
 */
export declare class ServiceReference {
    private service_id;
    constructor(service_id: string);
    getServiceId(): string;
}
