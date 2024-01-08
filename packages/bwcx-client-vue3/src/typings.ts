import 'reflect-metadata';
import type { RouteRecordRaw } from 'vue-router';

export type BwcxVueRouteMetaOptions = Omit<RouteRecordRaw, 'path' | 'component' | 'children'>;
// export type BwcxVueRouteMeta<R = {}> = BwcxVueRouteMetaOptions & {
//   path: string;
//   routeProps: Newable<R>;
//   childOf?: VueConstructor | Object;
//   priority?: number;
// };
// export type BwcxVueConstructorWithRouteMeta<V extends Vue = Vue, R = {}> = VueConstructor<V> & {
//   routeMeta: BwcxVueRouteMeta<R>;
// };
