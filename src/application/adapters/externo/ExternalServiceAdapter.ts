import { ExternalServicePort } from '../../../domain/port/externo/ExternalServicePort';

export class ExternalServiceAdapter implements ExternalServicePort {
  async callExternalService(payload: any): Promise<any> {
    // Placeholder: in a real adapter you'd call an HTTP API, message bus, etc.
    // For now return a simple echo for demonstration and testing.
    return { echoed: payload };
  }
}

export const externalServiceAdapter = new ExternalServiceAdapter();
