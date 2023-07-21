import { RequestContext, MiddlewareNext } from '..';
import METADATA_KEY from '../metadata-key';
import { IBwcxExceptionHandler } from '../interfaces';
import { Container, getDependency } from 'bwcx-core';

export default class ExceptionHandlerRegister {
  private container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  public getMiddleware() {
    return async (ctx: RequestContext, next: MiddlewareNext) => {
      try {
        await next();
      } catch (e) {
        const ctor = e.constructor;
        const exceptionHandler = Reflect.getMetadata(METADATA_KEY.ExceptionHandler, ctor);
        if (exceptionHandler) {
          const handler = getDependency<IBwcxExceptionHandler>(
            exceptionHandler,
            this.container,
          );
          await handler.catch(e, ctx);
        } else {
          throw e;
        }
      }
    };
  }
}
