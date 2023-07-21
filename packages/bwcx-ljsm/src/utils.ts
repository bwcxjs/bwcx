import compose from 'koa-compose';
import { ApplicationMiddleware } from '.';

export function combineMiddlewares(middlewares: ApplicationMiddleware[]): ApplicationMiddleware {
  return compose(middlewares);
}
