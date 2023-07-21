import METADATA_KEY from '../metadata-key';
import { IBwcxResponseHandler } from '../interfaces';
import { Newable } from 'bwcx-common';

export * from './decorators';

/**
 * Create response handler decorator.
 *
 * Controller class or route method decoration is supported.
 * @param responseHandlerClass
 */
export function createResponseHandlerDecorator(responseHandlerClass: Newable<IBwcxResponseHandler>) {
  return function (target: Object, propertyKey?: string, descriptor?: any) {
    if (propertyKey) {
      const ctor = target.constructor;
      const metadata = Reflect.getMetadata(METADATA_KEY.ControllerRouteMetadata, ctor, propertyKey);
      Reflect.defineMetadata(
        METADATA_KEY.ControllerRouteMetadata,
        {
          ...metadata,
          responseHandler: responseHandlerClass,
        },
        ctor,
        propertyKey,
      );
    } else {
      Reflect.defineMetadata(METADATA_KEY.ControllerResponseHandler, responseHandlerClass, target);
    }
  };
}
