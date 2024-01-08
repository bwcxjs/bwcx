export class AnalyserWarning extends Error {
  public isWarning = true;

  constructor(message: string) {
    super(message);
    this.name === 'AnalyserWarning';
    Error.captureStackTrace(this, this.constructor);
  }
}
