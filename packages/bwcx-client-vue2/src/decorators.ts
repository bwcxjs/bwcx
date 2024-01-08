import { Newable } from 'bwcx-common';
import METADATA_KEY from 'bwcx-client-vue/metadata-key';
import { BwcxVueRouteMetaOptions } from './typings';

/**
 * 声明视图
 * @decorator {class}
 * @param path 路由路径
 * @param routeProps 路由属性
 * @param options 其他传递给 vue-router 的选项
 */
export function View(path: string, routeProps?: Newable, options?: BwcxVueRouteMetaOptions) {
  return function(target: Function) {
    const routeMeta = Reflect.getOwnMetadata(METADATA_KEY.RouteMeta, target) || {};
    Reflect.defineMetadata(
      METADATA_KEY.RouteMeta,
      {
        ...routeMeta,
        path,
        routeProps,
        options,
      },
      target,
    );
  };
}
