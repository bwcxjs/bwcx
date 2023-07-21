import API_METADATA_KEY from './metadata-key';

/**
 * Get all declared API metadata.
 */
export function getApiMetadataItem<T = any>(
  key: symbol,
  ctor: Function,
  propertyKey?: string | symbol,
): T | undefined {
  return Reflect.getMetadata(key, ctor, propertyKey);
}

/**
 * Get API metadata for all declarations on routed methods/properties.
 */
export function getApiMetadata(ctor: Function, propertyKey: string | symbol) {
  const summary = Reflect.getOwnMetadata(API_METADATA_KEY.ApiSummary, ctor, propertyKey) as
    | string
    | undefined;
  const description = Reflect.getOwnMetadata(API_METADATA_KEY.ApiDescription, ctor, propertyKey) as
    | string
    | undefined;
  const deprecated = Reflect.getOwnMetadata(API_METADATA_KEY.ApiDeprecated, ctor, propertyKey) as
    | boolean
    | undefined;
  const version = Reflect.getOwnMetadata(API_METADATA_KEY.ApiVersion, ctor, propertyKey) as
    | string
    | undefined;
  const reference = Reflect.getOwnMetadata(API_METADATA_KEY.ApiReference, ctor, propertyKey) as
    | string
    | undefined;
  const inner = Reflect.getOwnMetadata(API_METADATA_KEY.ApiInner, ctor, propertyKey) as
    | boolean
    | undefined;
  return {
    summary,
    description,
    deprecated,
    version,
    reference,
    inner,
  };
}
