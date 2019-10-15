/**
 * When this class is passed as one of the arguments to a ServiceDefinition#setArguments(), it is converted
 * to a service with the given service_id when the ServiceDefinition is instantiated.
 */
export class ServiceReference {
  constructor(private service_id: string) {}

  getServiceId() {
    return this.service_id;
  }
}
