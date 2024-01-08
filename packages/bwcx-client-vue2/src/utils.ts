import { Newable } from 'bwcx-common';
import {
  getPropsDefinitionFromRouteProps,
  getReflectionRouteProps,
  RenderMethodKind,
} from 'bwcx-client-vue';
import Vue from 'vue';
import type { RouteConfig, RoutePropsFunction } from 'vue-router/types/router';
import type { RecordPropsDefinition } from 'vue/types/options';
import { BwcxVueRouteMetaOptions } from './typings';

export function mixinRouteProps<R>(routePropsClass: Newable<R>) {
  return Vue.extend({
    props: getPropsDefinitionFromRouteProps(routePropsClass) as RecordPropsDefinition<R>,
  });
}

export interface AnalysedOutputRoute {
  name: string;
  path: string;
  fullPath: string;
  component: () => Promise<any>;
  routeProps: Newable | undefined;
  priority?: number | undefined;
  renderMethod?: RenderMethodKind;
  otherOptions?: BwcxVueRouteMetaOptions | undefined;
  children?: AnalysedOutputRoute[];
}

export function parseRoutes(routes: AnalysedOutputRoute[]): RouteConfig[] {
  const parseRouteProps = (
    routePropsClass: Newable | undefined,
    propsInOptions?: boolean | Object | RoutePropsFunction,
  ): RoutePropsFunction => {
    const propsDef = getReflectionRouteProps(routePropsClass);
    return (route) => {
      const props: Object = {};
      propsDef.forEach((p) => {
        let value: any;
        if (p.type === 'param') {
          value = route.params[p.name];
        } else if (p.type === 'query') {
          value = route.query[p.name];
        }
        props[p.name] = p.options?.transformer ? p.options.transformer(value) : value;
      });
      // get original props value
      let objFromPropsInOptions: Object;
      if (typeof propsInOptions === 'function') {
        objFromPropsInOptions = propsInOptions(route);
      } else if (typeof propsInOptions === 'object') {
        objFromPropsInOptions = propsInOptions;
      }
      // merge props
      return {
        ...props,
        ...objFromPropsInOptions,
      };
    };
  };

  const parsedRoutes = [];
  for (const route of routes) {
    const r = {
      ...(route.otherOptions || {}),
      name: route.name,
      path: route.path,
      component: route.component,
      children: Array.isArray(route.children) ? parseRoutes(route.children) : undefined,
      props: parseRouteProps(route.routeProps, route.otherOptions?.props),
    };
    parsedRoutes.push(r);
  }
  return parsedRoutes;
}
