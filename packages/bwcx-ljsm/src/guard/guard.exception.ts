import { Exception } from '../exception';

export class GuardNotPassException extends Exception {
  constructor() {
    super('guard not pass');
    this.name = 'GuardNotPassException';
  }
}
