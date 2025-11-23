export class EventHandlerAdapter {
  async handle(eventName: string, payload: any): Promise<void> {
    // Placeholder: dispatch events to a queue, or call webhook handlers.
    // For demo, do nothing or log in future.
    return Promise.resolve();
  }
}

export const eventHandlerAdapter = new EventHandlerAdapter();
