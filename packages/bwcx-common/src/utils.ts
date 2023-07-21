import 'reflect-metadata';
import COMMON_METADATA_KEY from './metadata-key';
import type { Newable } from './typings';

export function isConstructor(f) {
  try {
    Reflect.construct(String, [], f);
  } catch (e) {
    return false;
  }
  return true;
}

export function combineDecorators(decorators: Function[]) {
  return function (target: any, key?: string | symbol, desc?: any) {
    let c = arguments.length;
    let r: any =
      c < 2 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc;
    let d: Function;
    for (let i = decorators.length - 1; i >= 0; i--) {
      if ((d = decorators[i])) {
        r = (c < 2 ? d(r) : c > 2 ? d(target, key, r) : d(target, key)) || r;
      }
    }
    return r;
  };
}

function getAllDtoMetadataFields<T extends { property: string }>(
  metadataKey: string | symbol,
  dto: Newable,
): T[] {
  const protoFields: T[] = [];
  let currentClass = dto;
  while (currentClass && currentClass.constructor !== Object) {
    const fields: T[] = Reflect.getOwnMetadata(metadataKey, currentClass) || [];
    protoFields.unshift(...fields);
    currentClass = Object.getPrototypeOf(currentClass);
  }
  const filteredFields: T[] = [];
  for (const field of protoFields) {
    const existedIndex = filteredFields.findIndex((f) => f.property === field.property);
    if (existedIndex >= 0) {
      filteredFields.splice(existedIndex, 1);
    }
    filteredFields.push(field);
  }
  return filteredFields;
}

export function getDtoMetadata(dto: Newable) {
  if (!dto) {
    return {
      fields: [],
      fileFields: [],
    };
  }
  const fields = getAllDtoMetadataFields<{ property: string; type: 'param' | 'query' | 'body' }>(
    COMMON_METADATA_KEY.ValidationFields,
    dto,
  );
  const fileFields = getAllDtoMetadataFields<{
    property: string;
    isArray: boolean;
    maxCount: number;
  }>(COMMON_METADATA_KEY.ValidationFileFields, dto);
  return {
    fields,
    fileFields,
  };
}
