import { ApplicationMiddleware, RequestContext } from '.';

export interface IBwcxMiddleware {
  use: ApplicationMiddleware;
}

export interface IBwcxExceptionHandler {
  catch(error: Error, ctx: RequestContext): void | Promise<void>;
}

export interface IBwcxGuard {
  canPass(ctx: RequestContext): boolean | Promise<boolean>;
}

export interface IBwcxResponseHandler {
  handle(response: any, ctx: RequestContext): any;
}

export interface IBwcxPlugin {
  onActivate(config: any): void | Promise<void>;

  getMiddleware?(): ApplicationMiddleware | Promise<ApplicationMiddleware>;

  afterWire?(): void | Promise<void>;

  beforeStart?(): void | Promise<void>;

  beforeExit?(): void | Promise<void>;
}
