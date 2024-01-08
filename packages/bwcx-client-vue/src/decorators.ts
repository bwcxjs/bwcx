import { BwcxVueRawRouteParamType, BwcxVueRawRouteQueryType } from './typings';
import { RenderMethodKind } from './enums';
import METADATA_KEY from './metadata-key';

/**
 * 声明为指定视图的子视图
 * @decorator {class}
 * @param parent 父视图组件名称
 */
export function ChildOf(parent: string) {
  return function(target: Function) {
    const routeMeta = Reflect.getOwnMetadata(METADATA_KEY.RouteMeta, target) || {};
    Reflect.defineMetadata(
      METADATA_KEY.RouteMeta,
      {
        ...routeMeta,
        childOf: parent,
      },
      target,
    );
  };
}

/**
 * 声明视图路由优先级
 * @decorator {class}
 * @param priority 优先级，必须为数字字面量，而非任何变量或枚举值
 */
export function Priority(priority: number) {
  return function(target: Function) {
    const routeMeta = Reflect.getOwnMetadata(METADATA_KEY.RouteMeta, target) || {};
    Reflect.defineMetadata(
      METADATA_KEY.RouteMeta,
      {
        ...routeMeta,
        priority,
      },
      target,
    );
  };
}

/**
 * 声明此参数处于 param 中
 * @decorator {property}
 */
export function InParam() {
  return function(target: Object, propertyKey: string | symbol) {
    const ctor = target.constructor;
    const keys = Reflect.getOwnMetadata(METADATA_KEY.RoutePropParamKeys, ctor) || [];
    const newKeys = [...keys];
    if (!newKeys.includes(propertyKey)) {
      newKeys.push(propertyKey);
    }
    Reflect.defineMetadata(METADATA_KEY.RoutePropParamKeys, newKeys, ctor);
  };
}

/**
 * 声明此参数处于 query 中
 * @decorator {property}
 */
export function InQuery() {
  return function(target: Object, propertyKey: string | symbol) {
    const ctor = target.constructor;
    const keys = Reflect.getOwnMetadata(METADATA_KEY.RoutePropQueryKeys, ctor) || [];
    const newKeys = [...keys];
    if (!newKeys.includes(propertyKey)) {
      newKeys.push(propertyKey);
    }
    Reflect.defineMetadata(METADATA_KEY.RoutePropQueryKeys, newKeys, ctor);
  };
}

/**
 * 声明 prop 的基础类型（即 vue prop 中的 `type`）
 * @decorator {property}
 * @param type 类型
 */
export function BaseType<T>(type: T) {
  return function(target: Object, propertyKey: string | symbol) {
    const ctor = target.constructor;
    const options =
      Reflect.getOwnMetadata(METADATA_KEY.RoutePropKeyOptions, ctor, propertyKey) || {};
    Reflect.defineMetadata(
      METADATA_KEY.RoutePropKeyOptions,
      {
        ...options,
        type,
      },
      ctor,
      propertyKey,
    );
  };
}

/**
 * 声明 prop 默认值（即 vue prop 中的 `default`）
 * @decorator {property}
 * @param defaultValue 默认值
 */
export function DefaultValue<T>(defaultValue: T | null | undefined | (() => T | null | undefined)) {
  return function(target: Object, propertyKey: string | symbol) {
    const ctor = target.constructor;
    const options =
      Reflect.getOwnMetadata(METADATA_KEY.RoutePropKeyOptions, ctor, propertyKey) || {};
    Reflect.defineMetadata(
      METADATA_KEY.RoutePropKeyOptions,
      {
        ...options,
        defaultValue,
      },
      ctor,
      propertyKey,
    );
  };
}

/**
 * 声明 prop 类型转换方法
 *
 * 默认根据属性的类型声明直接转换，如果属性类型不是基础类型（string、number、boolean），或其为数组亦或需要自定义转换时，需要使用此装饰器声明如何转换 prop。
 *
 * @decorator {property}
 * @param transformer 内置类型转换方法或指定自定义类型转换方法
 * @example
 * - TransformValue(Number) myQuery: SomeEnum; // 当类型声明不是基础类型时，需要手动指定
 * - TransformValue(String) myQuery: string[]; // 当类型声明为数组时
 * - TransformValue((value) => value === 'yes') myQuery: boolean; // 或声明自定义转换方法来覆盖
 */
export function TransformValue(
  transformer:
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | ((original: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) => any),
) {
  return function(target: Object, propertyKey: string | symbol) {
    const ctor = target.constructor;
    const options =
      Reflect.getOwnMetadata(METADATA_KEY.RoutePropKeyOptions, ctor, propertyKey) || {};
    Reflect.defineMetadata(
      METADATA_KEY.RoutePropKeyOptions,
      {
        ...options,
        transformer,
      },
      ctor,
      propertyKey,
    );
  };
}

/**
 * 声明此页面在服务端的首选渲染方法
 *
 * 其优先级高于全局页面默认渲染方法。
 * @decorator {class}
 * @param renderMethod 首选渲染方法
 */
export function RenderMethod(renderMethod: RenderMethodKind) {
  return function(target: Function) {
    Reflect.defineMetadata(METADATA_KEY.RouteRenderMethod, renderMethod, target);
  };
}
