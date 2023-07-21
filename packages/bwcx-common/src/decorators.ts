import COMMON_METADATA_KEY from './metadata-key';

function handleSetValidationField(
  target: Object,
  propertyKey: string,
  type: 'param' | 'query' | 'body',
) {
  const ctor = target.constructor;
  const validationFields = Reflect.getOwnMetadata(COMMON_METADATA_KEY.ValidationFields, ctor) || [];
  Reflect.defineMetadata(
    COMMON_METADATA_KEY.ValidationFields,
    [
      ...validationFields,
      {
        type,
        property: propertyKey,
      },
    ],
    ctor,
  );
}

/**
 * @decorator {property}
 */
export function FromParam() {
  return function (target: Object, propertyKey: string) {
    handleSetValidationField(target, propertyKey, 'param');
  };
}

/**
 * @decorator {property}
 */
export function FromQuery() {
  return function (target: Object, propertyKey: string) {
    handleSetValidationField(target, propertyKey, 'query');
  };
}

/**
 * @decorator {property}
 */
export function FromBody() {
  return function (target: Object, propertyKey: string) {
    handleSetValidationField(target, propertyKey, 'body');
  };
}

/**
 * @decorator {property}
 * @param maxCount Maximum file count (default unlimited)
 */
export function IsFile(maxCount?: number) {
  return function (target: Object, propertyKey: string) {
    const ctor = target.constructor;
    const validationFileFields =
      Reflect.getOwnMetadata(COMMON_METADATA_KEY.ValidationFileFields, ctor) || [];
    const type = Reflect.getOwnMetadata('design:type', target, propertyKey);
    const isArray = type === Array || maxCount > 1;
    Reflect.defineMetadata(
      COMMON_METADATA_KEY.ValidationFileFields,
      [
        ...validationFileFields,
        {
          property: propertyKey,
          isArray,
          maxCount: isArray ? maxCount : 1,
        },
      ],
      ctor,
    );
  };
}
