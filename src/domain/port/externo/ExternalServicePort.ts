export interface ExternalServicePort {
  // Example method signature for an external service call
  callExternalService(payload: any): Promise<any>;
}
