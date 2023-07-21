export * from './decorators';

export class Exception extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Exception';
    Error.captureStackTrace(this, this.constructor);
  }
}
