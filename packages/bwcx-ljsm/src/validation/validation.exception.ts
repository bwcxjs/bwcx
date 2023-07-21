import { ValidationError } from 'class-validator';
import { Exception } from '../exception';

export class ValidationException extends Exception {
  public source: 'req' | 'resp';
  public errors: ValidationError[];

  constructor(source: 'req' | 'resp', errors: ValidationError[], msg?: string) {
    super(`${source} validation failed${msg ? `: ${msg}` : ''}`);
    this.name = 'ValidationException';
    this.source = source;
    this.errors = errors;
  }
}
