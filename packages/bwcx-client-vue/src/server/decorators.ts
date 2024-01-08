import { Get, createReqParamDecorator } from 'bwcx-ljsm';
import { combineDecorators } from 'bwcx-common';
import { getDependency } from 'bwcx-core';
import { BwcxClientRoutesMapValue } from '../interfaces';
import { BwcxClientVueClientRoutesMapId } from './constants';

/**
 * 声明要应用客户端路由
 *
 * 将会应用全部客户端路由声明到当前方法。
 * @decorator {method}
 */
export function UseClientRoutes() {
  let routesMap: Map<string, BwcxClientRoutesMapValue>;
  try {
    routesMap = getDependency(BwcxClientVueClientRoutesMapId);
  } catch (e) {}
  if (!routesMap) {
    throw new Error(
      'No injected depency with identifier `BwcxClientVueClientRoutesMapId` found. Did you inject it before importing any `@UseClientRoutes` decorated classes?',
    );
  }
  const decorators = [];
  for (const k of routesMap.keys()) {
    const v = routesMap.get(k);
    decorators.push(
      Get(v.path, {
        isClientView: true,
        name: k,
        renderMethod: v.renderMethod,
      }),
    );
  }
  return combineDecorators(decorators);
}

/**
 * 取得路由声明的首选渲染方法
 * @decorator {param}
 */
export function PrimaryRenderMethod() {
  return createReqParamDecorator((ctx) => {
    return ctx.routeMeta?.renderMethod;
  });
}

/**
 * 声明重写指定自动装配的视图路由方法
 *
 * 必须声明在被 `@UseClientRoutes` 装饰的路由方法之前。
 * @decorator {method}
 * @param name 要重写的客户端视图名称
 */
export function OverrideView(name: string) {
  let routesMap: Map<string, BwcxClientRoutesMapValue>;
  try {
    routesMap = getDependency(BwcxClientVueClientRoutesMapId);
  } catch (e) {}
  if (!routesMap) {
    throw new Error(
      'No injected depency with identifier `BwcxClientVueClientRoutesMapId` found. Did you inject it before importing any `@OverrideView` decorated classes?',
    );
  }
  const routeData = routesMap.get(name);
  if (!routeData) {
    console.warn(`Client route name "${name}" was not found when using \`@OverrideView\``);
  }
  return Get(routeData.path, {
    isClientView: true,
    name,
    renderMethod: routeData.renderMethod,
  });
}
