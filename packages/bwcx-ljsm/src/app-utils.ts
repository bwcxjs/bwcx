import * as path from 'path';
import globby from 'globby';
import exitHook from 'async-exit-hook-improved';
import debug from 'debug';
import _ from 'lodash';
import { ROUTE_PARAM_TYPES } from './web/param-types';
import { RequestContext, MiddlewareNext } from '.';
import { IBwcxMiddleware, IBwcxGuard, IBwcxResponseHandler } from './interfaces';
import { GuardNotPassException } from './guard/guard.exception';
import { Newable } from 'bwcx-common';
import { Container } from 'bwcx-core';

const appScanDebug = debug('bwcx:app:scan');

export class AppUtils {
  public static load(baseDir: string, globs: string[]) {
    const files = globby.sync(globs, { cwd: baseDir }).map((g) => path.join(baseDir, g));
    for (const file of files) {
      appScanDebug('hit: %O', path.relative(baseDir, file));
      const exports = require(file);
    }
    return files;
  }

  public static resolveMiddleware(container: Container, middlewareClass: Newable<IBwcxMiddleware>) {
    return container.get<IBwcxMiddleware>(middlewareClass);
  }

  public static resolveAndWrapMiddleware(
    getRequestContainer: (ctx: RequestContext) => Container,
    middlewareClass: Newable<IBwcxMiddleware>,
  ) {
    return (ctx: RequestContext, next: MiddlewareNext) => {
      const middleware = this.resolveMiddleware(getRequestContainer(ctx), middlewareClass);
      return middleware.use(ctx, next);
    };
  }

  public static resolveAndWrapMiddlewares(
    getRequestContainer: (ctx: RequestContext) => Container,
    middlewareClasses: Newable<IBwcxMiddleware>[],
  ) {
    return middlewareClasses.map((middlewareClass) =>
      this.resolveAndWrapMiddleware(getRequestContainer, middlewareClass),
    );
  }

  public static resolveGuard(container: Container, guardClass: Newable<IBwcxGuard>) {
    return container.get<IBwcxGuard>(guardClass);
  }

  public static guardWrapper(
    getRequestContainer: (ctx: RequestContext) => Container,
    guardClass: Newable<IBwcxGuard>,
  ) {
    return async (ctx: RequestContext, next: MiddlewareNext) => {
      const guard = this.resolveGuard(getRequestContainer(ctx), guardClass);
      if (await guard.canPass(ctx)) {
        await next();
      } else {
        throw new GuardNotPassException();
      }
    };
  }

  public static guardOrWrapper(
    getRequestContainer: (ctx: RequestContext) => Container,
    guardClasses: Newable<IBwcxGuard>[],
  ) {
    return async (ctx: RequestContext, next: MiddlewareNext) => {
      let pass = false;
      for (const guardClass of guardClasses) {
        const guard = this.resolveGuard(getRequestContainer(ctx), guardClass);
        if (await guard.canPass(ctx)) {
          pass = true;
          break;
        }
      }
      if (pass) {
        await next();
      } else {
        throw new GuardNotPassException();
      }
    };
  }

  public static resolveAndWrapGuards(
    getRequestContainer: (ctx: RequestContext) => Container,
    guards: Array<Newable<IBwcxGuard> | Newable<IBwcxGuard>[]>,
  ) {
    return guards.map((guardOpt) => {
      if (Array.isArray(guardOpt)) {
        return this.guardOrWrapper(getRequestContainer, guardOpt);
      } else {
        return this.guardWrapper(getRequestContainer, guardOpt);
      }
    });
  }

  public static resolveResponseHandler(
    container: Container,
    responseHandlerClass: Newable<IBwcxResponseHandler>,
  ) {
    return container.get<IBwcxResponseHandler>(responseHandlerClass);
  }

  public static resolveAndWrapResponseHandler(
    getRequestContainer: (ctx: RequestContext) => Container,
    responseHandlerClass: Newable<IBwcxResponseHandler>,
  ) {
    return (response: any, ctx: RequestContext) => {
      const responseHandler = this.resolveResponseHandler(
        getRequestContainer(ctx),
        responseHandlerClass,
      );
      return responseHandler.handle(response, ctx);
    };
  }

  public static getRouteParam(
    ctx: RequestContext,
    param: { type: string; field?: string; handler?: (ctx: RequestContext) => any },
  ) {
    switch (param.type) {
      case ROUTE_PARAM_TYPES.Ctx:
        return ctx;
      case ROUTE_PARAM_TYPES.Query:
        return param.field ? _.get(ctx.query, param.field) : ctx.query;
      case ROUTE_PARAM_TYPES.Param:
        return param.field ? _.get(ctx.params, param.field) : ctx.params;
      case ROUTE_PARAM_TYPES.Body:
        // @ts-ignore
        return param.field ? _.get(ctx.request.body, param.field) : ctx.request.body;
      case ROUTE_PARAM_TYPES.File:
        return param.field ? _.get(ctx.files, param.field) : ctx.params;
      case ROUTE_PARAM_TYPES.Data:
        return param.field ? _.get(ctx.__bwcx__.data, param.field) : ctx.__bwcx__.data;
      case ROUTE_PARAM_TYPES.Header:
        return param.field ? _.get(ctx.headers, param.field) : ctx.headers;
      case ROUTE_PARAM_TYPES.Cookie:
        return ctx.cookies.get(param.field);
      case ROUTE_PARAM_TYPES.Session:
        return param.field ? _.get(ctx.session, param.field) : ctx.session;
      case ROUTE_PARAM_TYPES.UserAgent:
        return ctx.headers['user-agent'];
      case ROUTE_PARAM_TYPES.Referer:
        return ctx.headers.referer;
      case ROUTE_PARAM_TYPES.Host:
        return ctx.host;
      case ROUTE_PARAM_TYPES.Url:
        return ctx.url;
      case ROUTE_PARAM_TYPES.Custom:
        return param.handler(ctx);
      default:
        return null;
    }
  }
}

export class ExitHook {
  private hooks: Function[] = [];

  public addHook(func: Function) {
    const wrapped = async (callback) => {
      await func();
      callback?.();
    };
    this.hooks.push(wrapped);
    exitHook(wrapped);
  }

  public setExitTimeout(ms: number) {
    exitHook.forceExitTimeout(ms);
  }

  public clear() {
    this.hooks.forEach((hook) => {
      exitHook.remove(hook);
    });
    this.hooks.splice(0, this.hooks.length);
    exitHook.resetExitTimeout();
  }
}
