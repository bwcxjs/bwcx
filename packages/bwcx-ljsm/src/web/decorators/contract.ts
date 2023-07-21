import METADATA_KEY from '../../metadata-key';

/**
 * @decorator {method}
 */
export function Contract(req: any, resp: any): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: any) {
    const ctor = target.constructor;
    const metadata = Reflect.getMetadata(METADATA_KEY.ControllerRouteMetadata, ctor, propertyKey);
    Reflect.defineMetadata(
      METADATA_KEY.ControllerRouteMetadata,
      {
        ...metadata,
        contract: {
          req,
          resp,
        },
      },
      ctor,
      propertyKey,
    );
  };
}
