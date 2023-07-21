import API_METADATA_KEY from './metadata-key';

/**
 * Declare API summary.
 * @decorator {method}
 */
function Summary(value: string) {
  return function (target: Object, propertyKey: string | symbol, desc: PropertyDescriptor) {
    const ctor = target.constructor;
    Reflect.defineMetadata(API_METADATA_KEY.ApiSummary, value, ctor, propertyKey);
  };
}

/**
 * Declare description of an API or field.
 * @decorator {method, property}
 */
function Description(value: string) {
  return function (target: Object, propertyKey: string | symbol, desc?: PropertyDescriptor) {
    const ctor = target.constructor;
    Reflect.defineMetadata(API_METADATA_KEY.ApiDescription, value, ctor, propertyKey);
  };
}

/**
 * Declare an API or field is deprecated.
 * @decorator {method, property}
 */
 function Deprecated() {
  return function (target: Object, propertyKey: string | symbol, desc?: PropertyDescriptor) {
    const ctor = target.constructor;
    Reflect.defineMetadata(API_METADATA_KEY.ApiDeprecated, true, ctor, propertyKey);
  };
}

/**
 * Declare version of API or field.
 * @decorator {method, property}
 */
 function Version(value: string) {
  return function (target: Object, propertyKey: string | symbol, desc?: PropertyDescriptor) {
    const ctor = target.constructor;
    Reflect.defineMetadata(API_METADATA_KEY.ApiVersion, value, ctor, propertyKey);
  };
}

/**
 * Declare reference of an API or field.
 * @decorator {method, property}
 */
 function Reference(value: string) {
  return function (target: Object, propertyKey: string | symbol, desc?: PropertyDescriptor) {
    const ctor = target.constructor;
    Reflect.defineMetadata(API_METADATA_KEY.ApiReference, value, ctor, propertyKey);
  };
}


/**
 * Declare an API or field is inner.
 * @decorator {method, property}
 */
 function Inner() {
  return function (target: Object, propertyKey: string | symbol, desc?: PropertyDescriptor) {
    const ctor = target.constructor;
    Reflect.defineMetadata(API_METADATA_KEY.ApiInner, true, ctor, propertyKey);
  };
}

export const Api = {
  Summary,
  Description,
  Deprecated,
  Version,
  Reference,
  Inner,
};
