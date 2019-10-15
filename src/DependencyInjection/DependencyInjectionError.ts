export class DependencyInjectionError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}
