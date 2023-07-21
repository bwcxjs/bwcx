import METADATA_KEY from '../../metadata-key';
import { IBwcxMiddleware } from '../../interfaces';
import { Newable } from 'bwcx-common';
import { createCustomProvideDecoratorFactory, ProviderScope } from 'bwcx-core';

/**
 * @decorator {class}
 * @autoProvide {request-transient scope}
 */
export function Middleware(options: { when?: string | boolean; override?: boolean } = {}) {
  return createCustomProvideDecoratorFactory({
    scope: ProviderScope.DeferredTransient,
    when: options.when,
    override: options.override,
  })();
}

/**
 * @decorator {class, method}
 * @param middlewares
 */
export function UseMiddlewares(...middlewares: Newable<IBwcxMiddleware>[]) {
  return function (target: any, propertyKey?: string, descriptor?: any) {
    if (propertyKey) {
      const ctor = target.constructor;
      const metadata = Reflect.getMetadata(METADATA_KEY.ControllerRouteMetadata, ctor, propertyKey);
      const routeMiddlewares = metadata?.middlewares || [];
      Reflect.defineMetadata(
        METADATA_KEY.ControllerRouteMetadata,
        {
          ...metadata,
          middlewares: [...middlewares, ...routeMiddlewares],
        },
        ctor,
        propertyKey,
      );
    } else {
      const controllerMiddlewares = Reflect.getMetadata(METADATA_KEY.ControllerMiddlewares, target) || [];
      Reflect.defineMetadata(METADATA_KEY.ControllerMiddlewares, [...middlewares, ...controllerMiddlewares], target);
    }
  };
}
