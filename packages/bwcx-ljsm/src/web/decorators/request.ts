import METADATA_KEY from '../../metadata-key';
import { ROUTE_PARAM_TYPES } from '../param-types';

function handleAddParam(target: Object, propertyKey: string, parameterIndex: number, param: any) {
  const ctor = target.constructor;
  const params = Reflect.getMetadata(METADATA_KEY.ControllerRouteParams, ctor, propertyKey) || [];
  params.push({
    ...param,
    index: parameterIndex,
  });
  Reflect.defineMetadata(METADATA_KEY.ControllerRouteParams, params, ctor, propertyKey);
}

// export function Ctx(): ParameterDecorator {
//   return function (target: Object, propertyKey: string, parameterIndex: number) {
//     handleAddParam(target, propertyKey, parameterIndex, {
//       type: ROUTE_PARAM_TYPES.Ctx,
//     });
//   };
// }

/**
 * @decorator {param}
 * @param field
 */
export function Query(field?: string): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Query,
      field,
    });
  };
}

/**
 * @decorator {param}
 * @param field
 */
export function Param(field?: string): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Param,
      field,
    });
  };
}

/**
 * @decorator {param}
 * @param field
 */
export function Body(field?: string): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Body,
      field,
    });
  };
}

/**
 * @decorator {param}
 * @param field
 */
export function FormFile(field: string): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.File,
      field,
    });
  };
}

/**
 * @decorator {param}
 * @param field
 */
export function Data(field?: string): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Data,
      field,
    });
  };
}

/**
 * @decorator {param}
 * @param field
 */
export function Header(field?: string): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Header,
      field,
    });
  };
}

/**
 * @decorator {param}
 * @param field
 */
export function Cookie(field: string): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Cookie,
      field,
    });
  };
}

/**
 * @decorator {param}
 * @param field
 */
export function Session(field?: string): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Session,
      field,
    });
  };
}

/**
 * @decorator {param}
 */
export function UserAgent(): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.UserAgent,
    });
  };
}

/**
 * @decorator {param}
 */
export function Referer(): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Referer,
    });
  };
}

/**
 * @decorator {param}
 */
export function Host(): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Host,
    });
  };
}

/**
 * @decorator {param}
 */
export function Url(): ParameterDecorator {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    handleAddParam(target, propertyKey, parameterIndex, {
      type: ROUTE_PARAM_TYPES.Url,
    });
  };
}
