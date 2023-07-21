import CONTAINER_KEY from './container-key';
import { Inject } from 'bwcx-core';

/**
 * @decorator {property, param}
 */
export function InjectReflector() {
  return Inject(CONTAINER_KEY.Reflector);
}

/**
 * @decorator {class, method}
 * @param key
 * @param value
 */
export function SetMetadata(key: any, value: any) {
  return function (target: any, propertyKey?: string, descriptor?: any) {
    if (propertyKey) {
      Reflect.defineMetadata(key, value, target.constructor, propertyKey);
    } else {
      Reflect.defineMetadata(key, value, target);
    }
  };
}
