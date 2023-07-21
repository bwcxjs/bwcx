import METADATA_KEY from '../../metadata-key';
import { HttpMethod } from './../typings';

function handleRoute(
  target: Object,
  propertyKey: string | symbol,
  descriptor: any,
  method: HttpMethod,
  path?: string,
  meta?: any,
) {
  const ctor = target.constructor;
  const routeMethods: (string | symbol)[] = Reflect.getMetadata(METADATA_KEY.ControllerRoutes, ctor) || [];
  if (!routeMethods.includes(propertyKey)) {
    routeMethods.push(propertyKey);
  }
  Reflect.defineMetadata(METADATA_KEY.ControllerRoutes, routeMethods, ctor);
  const metadata =
    Reflect.getMetadata(METADATA_KEY.ControllerRouteMetadata, ctor, propertyKey) || {};
  const routeAliases = [
    ...(metadata.routeAliases || []),
    {
      method,
      path,
      meta,
    },
  ];
  Reflect.defineMetadata(
    METADATA_KEY.ControllerRouteMetadata,
    {
      ...metadata,
      method,
      path,
      routeAliases,
    },
    ctor,
    propertyKey,
  );
}

/**
 * @decorator {method}
 * @param path
 */
export function Get(path?: string, meta?: any): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    handleRoute(target, propertyKey, descriptor, 'GET', path, meta);
  };
}

/**
 * @decorator {method}
 * @param path
 */
export function Post(path?: string, meta?: any): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    handleRoute(target, propertyKey, descriptor, 'POST', path, meta);
  };
}

/**
 * @decorator {method}
 * @param path
 */
export function Put(path?: string, meta?: any): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    handleRoute(target, propertyKey, descriptor, 'PUT', path, meta);
  };
}

/**
 * @decorator {method}
 * @param path
 */
export function Patch(path?: string, meta?: any): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    handleRoute(target, propertyKey, descriptor, 'PATCH', path, meta);
  };
}

/**
 * @decorator {method}
 * @param path
 */
export function Delete(path?: string, meta?: any): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    handleRoute(target, propertyKey, descriptor, 'DELETE', path, meta);
  };
}

/**
 * @decorator {method}
 * @param path
 */
export function Head(path?: string, meta?: any): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    handleRoute(target, propertyKey, descriptor, 'HEAD', path, meta);
  };
}

/**
 * @decorator {method}
 * @param path
 */
export function Options(path?: string, meta?: any): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    handleRoute(target, propertyKey, descriptor, 'OPTIONS', path, meta);
  };
}

/**
 * @decorator {method}
 * @param path
 */
export function All(path?: string, meta?: any): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    handleRoute(target, propertyKey, descriptor, 'ALL', path, meta);
  };
}
