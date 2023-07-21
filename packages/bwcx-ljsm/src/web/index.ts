import METADATA_KEY from '../metadata-key';
import { RequestContext } from '..';
import { ROUTE_PARAM_TYPES } from './param-types';
import { UseMiddlewares } from './decorators';
import { IBwcxMiddleware } from '../interfaces';
import { Newable } from 'bwcx-common';

export * from './decorators';
export * from './utils';

export function createReqParamDecorator(handler: (ctx: RequestContext) => any): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    const ctor = target.constructor;
    const routeParams =
      Reflect.getMetadata(METADATA_KEY.ControllerRouteParams, ctor, propertyKey) || [];
    routeParams.push({
      type: ROUTE_PARAM_TYPES.Custom,
      handler,
      index: parameterIndex,
    });
    Reflect.defineMetadata(METADATA_KEY.ControllerRouteParams, routeParams, ctor, propertyKey);
  };
}

export function createMiddlewareDecorator(middleware: Newable<IBwcxMiddleware>) {
  return UseMiddlewares(middleware);
}
