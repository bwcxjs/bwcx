import 'reflect-metadata';
import { Newable } from 'bwcx-common';
import { RenderMethodKind } from 'bwcx-client-vue';
import { BwcxVueRouteMetaOptions } from './typings';

/**
 * 声明 route view
 *
 * 用于非 class component 声明路由。
 * @param component vue 组件
 * @param path 路由路径
 * @param routeProps 路由属性
 * @param options 其他传递给 vue-router 的选项
 * @param extraMeta 声明父组件、路由优先级、渲染方法
 */
 export function routeView(
  component: any,
  path: string,
  routeProps?: Newable,
  options?: BwcxVueRouteMetaOptions,
  extraMeta?: {
    childOf?: string;
    priority?: number;
    renderMethod?: RenderMethodKind;
  },
) {
  // 诶嘿
  return component;
}

export * from 'bwcx-client-vue';
export * from './typings';
export * from './interfaces';
export * from './decorators';
export * from './plugin';
export * from './utils';
