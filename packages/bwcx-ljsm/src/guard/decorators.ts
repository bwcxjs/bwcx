import METADATA_KEY from '../metadata-key';
import { IBwcxGuard } from '../interfaces';
import { createCustomProvideDecoratorFactory, ProviderScope } from 'bwcx-core';
import { Newable } from 'bwcx-common';

/**
 * @decorator {class}
 * @autoProvide {DeferredTransient scope}
 */
export function Guard(options: { when?: string | boolean; override?: boolean } = {}) {
  return createCustomProvideDecoratorFactory({
    scope: ProviderScope.DeferredTransient,
    when: options.when,
    override: options.override,
  })();
}

/**
 * @decorator {class, method}
 * @param guards
 */
export function UseGuards(...guards: Newable<IBwcxGuard>[]) {
  return function (target: any, propertyKey?: string, descriptor?: any) {
    if (propertyKey) {
      const ctor = target.constructor;
      const metadata = Reflect.getMetadata(METADATA_KEY.ControllerRouteMetadata, ctor, propertyKey);
      const routeGuards = metadata?.guards || [];
      Reflect.defineMetadata(
        METADATA_KEY.ControllerRouteMetadata,
        {
          ...metadata,
          guards: [...guards, ...routeGuards],
        },
        ctor,
        propertyKey,
      );
    } else {
      const controllerGuards = Reflect.getMetadata(METADATA_KEY.ControllerGuards, target) || [];
      Reflect.defineMetadata(METADATA_KEY.ControllerGuards, [...guards, ...controllerGuards], target);
    }
  };
}

/**
 * @decorator {class, method}
 * @param guards
 */
export function UseGuardsOr(...guards: Newable<IBwcxGuard>[]) {
  return function (target: any, propertyKey?: string, descriptor?: any) {
    if (propertyKey) {
      const ctor = target.constructor;
      const metadata = Reflect.getMetadata(METADATA_KEY.ControllerRouteMetadata, ctor, propertyKey);
      const routeGuards = metadata?.guards || [];
      Reflect.defineMetadata(
        METADATA_KEY.ControllerRouteMetadata,
        {
          ...metadata,
          guards: [guards, ...routeGuards],
        },
        ctor,
        propertyKey,
      );
    } else {
      const controllerGuards = Reflect.getMetadata(METADATA_KEY.ControllerGuards, target) || [];
      Reflect.defineMetadata(METADATA_KEY.ControllerGuards, [guards, ...controllerGuards], target);
    }
  };
}
