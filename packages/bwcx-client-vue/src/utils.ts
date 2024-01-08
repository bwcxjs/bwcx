import { Newable } from 'bwcx-common';
import { configure as configureUrlcat } from 'urlcat-fork';
import { BwcxVueRawRouteParamType, BwcxVueRawRouteQueryType } from './typings';
import METADATA_KEY from './metadata-key';
import { BwcxClientRoutesMapValue } from './interfaces';

const urlcat = configureUrlcat({ arrayFormat: 'repeat' });

export abstract class AbstractRouterAction {
  public constructor(
    protected readonly routesMap: Map<string, BwcxClientRoutesMapValue>,
    protected readonly name: string,
  ) {}

  public formatUrl(options: any) {
    const { path } = this.routesMap.get(this.name);
    return urlcat(path, {
      ...options,
    });
  }

  protected parseOptions(options: any) {
    const { routeProps: routePropsClass } = this.routesMap.get(this.name);
    const propsDef = getReflectionRouteProps(routePropsClass);
    const parsedOpts = {
      params: {} as object,
      query: {} as object,
    };
    if (!options) {
      return parsedOpts;
    }
    Object.keys(options).forEach((k) => {
      if (options.hasOwnProperty(k)) {
        const def = propsDef.find((p) => p.name === k);
        if (def.type === 'param') {
          parsedOpts.params[k] = options[k];
        } else if (def.type === 'query') {
          parsedOpts.query[k] = options[k];
        }
      }
    });
    return parsedOpts;
  }
}

export interface RoutePropDefinition {
  name: string;
  type: 'param' | 'query';
  options: {
    type?: Object;
    default?: any | null | undefined | (() => any | null | undefined);
    transformer?:
      | StringConstructor
      | NumberConstructor
      | BooleanConstructor
      | ((original: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) => any);
  };
}

export function getReflectionRouteProps(
  routePropsClass: Newable | undefined,
): RoutePropDefinition[] {
  if (!routePropsClass) {
    return [];
  }
  const paramKeys = Reflect.getMetadata(METADATA_KEY.RoutePropParamKeys, routePropsClass) || [];
  const queryKeys = Reflect.getMetadata(METADATA_KEY.RoutePropQueryKeys, routePropsClass) || [];
  const props = [
    ...paramKeys.map((k) => ({
      name: k,
      type: 'param',
      options: {},
    })),
    ...queryKeys.map((k) => ({
      name: k,
      type: 'query',
      options: {},
    })),
  ];
  for (const p of props) {
    const options =
      Reflect.getMetadata(METADATA_KEY.RoutePropKeyOptions, routePropsClass, p.name) || {};
    const type =
      options.type || Reflect.getMetadata('design:type', routePropsClass.prototype, p.name);
    // get transformer
    let t: Function;
    if (
      options.transformer === String ||
      options.transformer === Number ||
      options.transformer === Boolean
    ) {
      const typeTransformer = StringLikeTypeTransformer.getTransformerByType(
        // @ts-ignore
        options.transformer,
      );
      if (type === Array) {
        t = StringLikeTypeTransformer.transformToArrayFactory(typeTransformer);
      } else {
        t = typeTransformer;
      }
    } else if (options.transformer) {
      t = options.transformer;
    }
    const transformer =
      t || StringLikeTypeTransformer.getTransformerByType(type) || ((val: any) => val);

    p.options = {
      type,
      default: options.defaultValue,
      transformer,
    };
  }
  return props;
}

export function getPropsDefinitionFromRouteProps(routePropsClass: Newable) {
  // @ts-ignore
  const props: any = {};
  const propsDef = getReflectionRouteProps(routePropsClass);
  for (const p of propsDef) {
    props[p.name] = {
      type: p.options.type,
      default: p.options.default,
    };
  }
  return props;
}

export class StringLikeTypeTransformer {
  public static getTransformerByType(
    type: StringConstructor,
  ): (val: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) => string;
  public static getTransformerByType(
    type: NumberConstructor,
  ): (val: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) => number;
  public static getTransformerByType(
    type: BooleanConstructor,
  ): (val: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) => boolean;
  public static getTransformerByType(
    type: StringConstructor | NumberConstructor | BooleanConstructor,
  ) {
    switch (type) {
      case String:
        return this.transformToString;
      case Number:
        return this.transformToNumber;
      case Boolean:
        return this.transformToBoolean;
    }
  }

  public static transformToString(val: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) {
    return val === undefined ? undefined : String(val);
  }

  public static transformToNumber(val: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) {
    return val === undefined ? undefined : Number(val);
  }

  public static transformToBoolean(val: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) {
    return val === undefined ? undefined : !!(val && val !== '0' && val !== 'false');
  }

  public static transformToArrayFactory<T>(
    baseTransformer: (val: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) => T,
  ) {
    return (val: BwcxVueRawRouteParamType | BwcxVueRawRouteQueryType) => {
      if (val === undefined) {
        return undefined;
      }
      let arr = Array.isArray(val) ? val : [val];
      return arr.map((v) => baseTransformer?.(v) ?? v);
    };
  }
}
