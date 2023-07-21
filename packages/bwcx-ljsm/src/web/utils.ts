import { Newable } from 'bwcx-common';
import { IBwcxMiddleware, IBwcxGuard, IBwcxResponseHandler } from '..';
import METADATA_KEY from '../metadata-key';

export interface IRouteMetadata {
  name: string;
  method: string;
  path: string;
  routeAliases: {
    method: string;
    path: string;
    meta?: any;
  }[];
  contract: {
    req: Newable | null | undefined;
    resp: Newable | null | undefined;
  };
  middlewares: Newable<IBwcxMiddleware>[];
  guards: Newable<IBwcxGuard>[];
  responseHandler: Newable<IBwcxResponseHandler> | null | undefined;
}

export function getRouteMetadata(controller: Newable, route: string): IRouteMetadata {
  const metadata =
    Reflect.getMetadata(METADATA_KEY.ControllerRouteMetadata, controller, route) || {};
  if (typeof metadata !== 'object' || !metadata.method) {
    throw new Error(`No controller method configured (${controller.name}.${route})`);
  }
  return {
    name: metadata.name || route,
    method: metadata.method,
    path: metadata.path || `/${route}`,
    routeAliases: (metadata.routeAliases || [])
      .map((r) => ({
        ...r,
        path: r.path || `/${route}`,
      }))
      .reverse(),
    contract: {
      req: metadata.contract?.req,
      resp: metadata.contract?.resp,
    },
    middlewares: metadata.middlewares || [],
    guards: metadata.guards || [],
    responseHandler: metadata.responseHandler,
  };
}
