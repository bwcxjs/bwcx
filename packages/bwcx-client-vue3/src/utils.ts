import { Newable } from 'bwcx-common';
import { getPropsDefinitionFromRouteProps, getReflectionRouteProps, RenderMethodKind } from 'bwcx-client-vue';
import type { ComponentOptions, Prop } from 'vue';
import type { RouteRecordRaw, RouteLocationNormalizedLoaded } from 'vue-router';
import { Vue } from 'vue-class-component';
import type { VueConstructor, VueWithProps } from 'vue-class-component';
import { BwcxVueRouteMetaOptions } from './typings';

export function getMixinRouteProps<R>(routePropsClass: Newable<R>) {
  return {
    props: getPropsDefinitionFromRouteProps(routePropsClass) as Prop<R>,
  };
}

export function mixinRouteProps<R>(routePropsClass: Newable<R>): VueConstructor<Vue & VueWithProps<R>> {
  class PropsMixin extends Vue {
    static __b: ComponentOptions = {
      props: getPropsDefinitionFromRouteProps(routePropsClass),
    };
  }
  // @ts-ignore
  return PropsMixin;
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

export function parseRoutes(routes: AnalysedOutputRoute[]): RouteRecordRaw[] {
  const parseRouteProps = (routeConfig: AnalysedOutputRoute): ((route: RouteLocationNormalizedLoaded) => Object) => {
    const propsDef = getReflectionRouteProps(routeConfig.routeProps);
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
      const propsInOptions = routeConfig.otherOptions?.props;
      if (typeof propsInOptions === 'function') {
        objFromPropsInOptions = propsInOptions(route);
      } else if (typeof propsInOptions === 'object') {
        objFromPropsInOptions = propsInOptions;
      }
      // merge props
      return {
        ...props,
        // @ts-ignore
        ...route.meta?.state?.__bwcx_route_extraProps?.[routeConfig.name], // pass route related state (like `asyncData`) to props
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
      // @ts-ignore
      props: parseRouteProps(route),
    };
    parsedRoutes.push(r);
  }
  return parsedRoutes;
}
