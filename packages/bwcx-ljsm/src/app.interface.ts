import { IValidationConfig } from './validation';
import { IBwcxMiddleware, IBwcxGuard, IBwcxPlugin, IBwcxResponseHandler } from './interfaces';
import { RequestContext } from '.';
import { Options as BodyParserOptions } from 'koa-bodyparser';
import { Options as MulterOptions } from 'multer';
import { IRouteMetadata } from './web/utils';
import { Newable } from 'bwcx-common';
import { DependencyIdentifier } from 'bwcx-core';

export interface IAppConfig {
  baseDir: string;
  scanGlobs: string[];
  port?: number;
  hostname?: string;
  backlog?: number;
  exitTimeout: number;
  plugins: { plugin: Newable<IBwcxPlugin>; configIdentifier: DependencyIdentifier }[];
  globalMiddlewares: Newable<IBwcxMiddleware>[];
  globalGuards: Newable<IBwcxGuard>[];
  validation: IValidationConfig;
  responseHandler?: Newable<IBwcxResponseHandler>;
  bodyParserOptions?: BodyParserOptions | null;
  multerOptions?: MulterOptions | null;
}

export interface IAppRouteData {
  metadata: IRouteMetadata;
  propertyKey: string;
  arguments: Array<{
    index: number;
    type: string;
    field?: string;
    handler?: (ctx: RequestContext) => any;
  }>;
}

export interface IAppRouterDataItem {
  controller: Newable;
  path: string;
  middlewares: Newable<IBwcxMiddleware>[];
  guards: Array<Newable<IBwcxGuard> | Newable<IBwcxGuard>[]>;
  responseHandler: Newable<IBwcxResponseHandler> | null;
  routes: IAppRouteData[];
}

export interface IAppWiredData {
  router: IAppRouterDataItem[];
}
