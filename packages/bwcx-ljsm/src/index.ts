import 'reflect-metadata';
import { Newable } from 'bwcx-common';
import { Container } from 'bwcx-core';
import KoaApplication from 'koa';

export interface ApplicationInstance extends KoaApplication {}

export interface RequestContext extends KoaApplication.Context {
  container: Container;
  routeMeta?: any;
  __bwcx__: {
    controller: Newable;
    route: string;
    controllerReflectionContextContainer: Container;
    routeReflectionContextContainer: Container;
    data?: any;
    route_return?: any;
  };
}

export type MiddlewareNext = () => Promise<any>;

export type ApplicationMiddleware = (ctx: RequestContext, next: MiddlewareNext) => any;

export type UploadFile = Express.Multer.File;

export { App, InjectApp, InjectAppConfig } from './app';
export * from './app.interface';
export * from './interfaces';
export * from './utils';

export * from './config';
export * from './exception';
export * from './guard';
export * from './plugin';
export * from './reflector';
export * from './response-handler';
export * from './validation';
export * from './web';
