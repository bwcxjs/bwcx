import Koa from 'koa';
import Router from 'koa-router';
import _ from 'lodash';
import CONTAINER_KEY from './container-key';
import METADATA_KEY from './metadata-key';
import COMMON_METADATA_KEY from 'bwcx-common/metadata-key';
import { ApplicationInstance, RequestContext, MiddlewareNext, ApplicationMiddleware } from '.';
import { IAppConfig, IAppRouterDataItem, IAppWiredData } from './app.interface';
import { IBwcxMiddleware, IBwcxGuard, IBwcxPlugin, IBwcxResponseHandler } from './interfaces';
import ValidationRegister from './validation/register';
import ExceptionHandlerRegister from './exception/register';
import bodyParser from 'koa-bodyparser';
import multer from '@koa/multer';
import { Multer } from 'multer';
import { AppUtils, ExitHook } from './app-utils';
import { getRouteMetadata } from './web/utils';
import { Reflector } from './reflector';
import debug from 'debug';
import { Newable } from 'bwcx-common';
import {
  Container,
  createRequestContainer,
  DependencyIdentifier,
  getContainer,
  getDependency,
  getRequestScopeProviders,
  Inject,
} from 'bwcx-core';
import { Server } from 'http';

const appDebug = debug('bwcx:app');
const appWireDebug = debug('bwcx:app:wire');

export abstract class App {
  /**
   * IoC Container.
   *
   * @type {Container}
   * @memberof App
   */
  public container: Container = getContainer();

  /**
   * Koa app instance.
   *
   * Only available in the lifecycle after `init`.
   *
   * @type {ApplicationInstance}
   * @memberof App
   */
  public instance: ApplicationInstance;

  /**
   * HTTP server instance.
   *
   * Only available in the life cycle after `start`.
   *
   * @type {ApplicationInstance}
   * @memberof App
   */
   public server: Server;

  /**
   * Application config: project base path.
   *
   * @protected
   * @type {string}
   * @memberof App
   */
  protected baseDir: IAppConfig['baseDir'] = process.cwd();

  /**
   * Application config: glob for the files to be scanned.
   *
   * @protected
   * @type {string[]}
   * @memberof App
   */
  protected scanGlobs: IAppConfig['scanGlobs'] = [];

  /**
   * Application config: port.
   *
   * @see Koa app.listen()
   * @protected
   * @type {number}
   * @memberof App
   */
  protected port?: IAppConfig['port'];

  /**
   * Application config: hostname.
   *
   * @see Koa app.listen()
   * @protected
   * @type {string}
   * @memberof App
   */
  protected hostname?: IAppConfig['hostname'];

  /**
   * Application config: backlog.
   *
   * @see Koa app.listen()
   * @protected
   * @type {number}
   * @memberof App
   */
  protected backlog?: IAppConfig['backlog'];

  /**
   * Application config: asynchronous exit timeout.
   *
   * If all beforeExit hooks run out of time before exiting then it will force an exit.
   *
   * @protected
   * @type {IAppConfig['exitTimeout']}
   * @memberof App
   */
  protected exitTimeout: IAppConfig['exitTimeout'] = 10000;

  /**
   * Application config: plugins to be applied.
   *
   * @protected
   * @type {IAppConfig['plugins']}
   * @memberof App
   */
  protected plugins: IAppConfig['plugins'] = [];

  /**
   * Application config: global middlewares.
   *
   * @protected
   * @type {IAppConfig['globalMiddlewares']}
   * @memberof App
   */
  protected globalMiddlewares: IAppConfig['globalMiddlewares'] = [];

  /**
   * Application config: global guards.
   *
   * @protected
   * @type {IAppConfig['globalGuards']}
   * @memberof App
   */
  protected globalGuards: IAppConfig['globalGuards'] = [];

  /**
   * Application config: validation.
   *
   * @protected
   * @type {IAppConfig['validation']}
   * @memberof App
   */
  protected validation: IAppConfig['validation'] = {};

  /**
   * Application config: response handler.
   *
   * @protected
   * @type {IAppConfig['responseHandler']}
   * @memberof App
   */
  protected responseHandler: IAppConfig['responseHandler'];

  /**
   * Application config: bodyparser.
   *
   * @see koa-bodyparser https://github.com/koajs/bodyparser
   * @protected
   * @type {IAppConfig['multer']}
   * @memberof App
   */
  protected bodyParserOptions: IAppConfig['bodyParserOptions'];

  /**
   * Application config: multer.
   *
   * @see Multer https://github.com/expressjs/multer
   * @protected
   * @type {IAppConfig['multer']}
   * @memberof App
   */
  protected multerOptions: IAppConfig['multerOptions'];

  /**
   * Application config.
   *
   * @readonly
   * @type {IAppConfig}
   * @memberof App
   */
  get appConfig(): IAppConfig {
    return {
      baseDir: this.baseDir,
      scanGlobs: this.scanGlobs,
      port: this.port,
      hostname: this.hostname,
      backlog: this.backlog,
      exitTimeout: this.exitTimeout,
      plugins: this.plugins,
      globalMiddlewares: this.globalMiddlewares,
      globalGuards: this.globalGuards,
      validation: this.validation,
      responseHandler: this.responseHandler,
      bodyParserOptions: this.bodyParserOptions,
      multerOptions: this.multerOptions,
    };
  }

  private _pluginInstances: IBwcxPlugin[] = [];
  private _exitHook: ExitHook = new ExitHook();
  private _multerInstance: Multer;

  /**
   * Use plugin.
   * @param plugin Plugin class
   * @param configIdentifier The configuration of the plugin (an identifier of configuration class)
   */
  protected usePlugin(plugin: Newable<IBwcxPlugin>, configIdentifier: DependencyIdentifier) {
    return {
      plugin,
      configIdentifier,
    };
  }

  /**
   * Lifecycle: before application initialization.
   *
   * Application configuration can be initialized here, such as pulling environment information asynchronously.
   */
  protected beforeInit(): void | Promise<void> {}

  /**
   * Auto-scan dependencies.
   * @returns Array of scanned dependencies
   */
  public scan() {
    return AppUtils.load(this.baseDir, this.scanGlobs);
  }

  /**
   * Inner: Application initialization.
   *
   * Dependency scanning and app instance creation.
   */
  private async _init() {
    this.container.bind(CONTAINER_KEY.App).toConstantValue(this);
    this.container.bind(CONTAINER_KEY.AppConfig).toConstantValue(this.appConfig);
    this.instance = new Koa();
    this._exitHook.setExitTimeout(this.exitTimeout);
    this.bodyParserOptions !== null && this.instance.use(bodyParser(this.bodyParserOptions));
    this.multerOptions !== null && (this._multerInstance = multer(this.multerOptions));
  }

  /**
   * Lifecycle: before application framework wiring.
   *
   * It is possible to bind the uppermost layer of legacy Koa middleware here, or to register non-auto-wired routes in the legacy form.
   */
  protected beforeWire(): void | Promise<void> {}

  /**
   * Inner: Application framework wiring
   *
   * @returns Wired data
   */
  private async _wire(): Promise<IAppWiredData> {
    const validationRegister = new ValidationRegister(this.validation);
    const exceptionHandlerRegister = new ExceptionHandlerRegister(this.container);
    // Activation plugins
    for (const { plugin, configIdentifier } of this.plugins) {
      appWireDebug('activating plugin: %O', plugin);
      const pluginConfig = getDependency<any>(configIdentifier, this.container);
      const pluginInstance = getDependency<IBwcxPlugin>(plugin, this.container);
      this._pluginInstances.push(pluginInstance);
      await pluginInstance.onActivate(pluginConfig);
    }
    // Initializing plug-in middleware
    const pluginMiddlewares: ApplicationMiddleware[] = [];
    for (const pluginInstance of this._pluginInstances) {
      if (pluginInstance.getMiddleware) {
        const middleware = await pluginInstance.getMiddleware();
        pluginMiddlewares.push(middleware);
      }
    }
    // Get global middlewares
    appWireDebug('detected global middlewares: %O', this.globalMiddlewares);
    const globalMiddlewares = AppUtils.resolveAndWrapMiddlewares(
      (ctx) => ctx.container,
      this.globalMiddlewares,
    );
    // Get global guards
    appWireDebug('detected global guards: %O', this.globalGuards);
    const globalGuards = AppUtils.resolveAndWrapGuards((ctx) => ctx.container, this.globalGuards);
    // Get the default response handler
    this.responseHandler &&
      appWireDebug('detected default response handler: %O', this.responseHandler);
    const defaultResponseHandler = this.responseHandler
      ? AppUtils.resolveAndWrapResponseHandler((ctx) => ctx.container, this.responseHandler)
      : null;

    // Wire routing
    const routerData = [];
    const routers = [];
    if (this.container.isBound(CONTAINER_KEY.Controllers)) {
      // const controllers = this.container.getAll<any>(TYPES.Controllers);
      // Get all controller classes
      const controllers = this.container
        .getAll<Newable>(CONTAINER_KEY.Controllers)
        .filter((c) => getRequestScopeProviders(c).length > 0);
      controllers.sort((a, b) => {
        const aPriority: number = Reflect.getMetadata(METADATA_KEY.ControllerPriority, a) || 0;
        const bPriority: number = Reflect.getMetadata(METADATA_KEY.ControllerPriority, b) || 0;
        return bPriority - aPriority;
      });
      controllers.forEach((controller) => {
        // Take the path of this controller, which is the first parameter of @Controller()
        const controllerPath: string = Reflect.getMetadata(METADATA_KEY.ControllerPath, controller);
        // Get the middlewares needed for this controller
        const controllerMiddlewareClasses: Newable<IBwcxMiddleware>[] =
          Reflect.getMetadata(METADATA_KEY.ControllerMiddlewares, controller) || [];
        const controllerMiddlewares = AppUtils.resolveAndWrapMiddlewares(
          (ctx) => ctx.__bwcx__.controllerReflectionContextContainer,
          controllerMiddlewareClasses,
        );
        // Get the guards needed for this controller
        const controllerGuardClasses: Array<Newable<IBwcxGuard> | Newable<IBwcxGuard>[]> =
          Reflect.getMetadata(METADATA_KEY.ControllerGuards, controller) || [];
        const controllerGuards = AppUtils.resolveAndWrapGuards(
          (ctx) => ctx.__bwcx__.controllerReflectionContextContainer,
          controllerGuardClasses,
        );
        // Get the response handler for this controller
        const controllerResponseHandlerClass: Newable<IBwcxResponseHandler> = Reflect.getMetadata(
          METADATA_KEY.ControllerResponseHandler,
          controller,
        );
        const controllerResponseHandler = controllerResponseHandlerClass
          ? AppUtils.resolveAndWrapResponseHandler(
              (ctx) => ctx.__bwcx__.controllerReflectionContextContainer,
              controllerResponseHandlerClass,
            )
          : null;
        appWireDebug('wiring controller: %O, metadata: %O', controller, {
          path: controllerPath,
          middlewares: controllerMiddlewareClasses,
          guards: controllerGuardClasses,
          responseHandler: controllerResponseHandlerClass,
        });
        const routeData: IAppRouterDataItem = {
          controller,
          path: controllerPath,
          middlewares: controllerMiddlewareClasses,
          guards: controllerGuardClasses,
          responseHandler: controllerResponseHandlerClass,
          routes: [],
        };
        // Get the names of all the methods registered as routes under this controller
        const routes: string[] =
          Reflect.getMetadata(METADATA_KEY.ControllerRoutes, controller) || [];
        const router = new Router({
          prefix: controllerPath,
        });
        routes.forEach((route) => {
          // Get the route metadata on this method
          const routeMetadata = getRouteMetadata(controller, route);
          Reflect.defineMetadata(
            METADATA_KEY.ControllerRouteMetadataParsed,
            routeMetadata,
            controller,
            route,
          );
          appWireDebug(`wiring route: %O, metadata: %O`, route, routeMetadata);
          const contract = routeMetadata.contract;
          // Check and profile upload fields
          const uploadFields = [];
          if (contract.req) {
            const validationFileFields: {
              property: string;
              isArray: boolean;
              maxCount?: number;
            }[] = Reflect.getMetadata(COMMON_METADATA_KEY.ValidationFileFields, contract.req) || [];
            validationFileFields.forEach((field) => {
              uploadFields.push({
                name: field.property,
                maxCount: field.maxCount,
              });
            });
          }
          // Get the middlewares needed for this method
          const routeMiddlewares = AppUtils.resolveAndWrapMiddlewares(
            (ctx) => ctx.__bwcx__.routeReflectionContextContainer,
            routeMetadata.middlewares || [],
          );
          // Get the guards needed for this method
          const routeGuards = AppUtils.resolveAndWrapGuards(
            (ctx) => ctx.__bwcx__.routeReflectionContextContainer,
            routeMetadata.guards || [],
          );
          // Get the response handler needed for this method
          const routeResponseHandler = routeMetadata.responseHandler
            ? AppUtils.resolveAndWrapResponseHandler(
                (ctx) => ctx.__bwcx__.routeReflectionContextContainer,
                routeMetadata.responseHandler,
              )
            : null;
          // Get all the parameters of this method that need to be injected
          const routeParams = (
            Reflect.getMetadata(METADATA_KEY.ControllerRouteParams, controller, route) || []
          ).sort((a, b) => a.index - b.index);
          appWireDebug('wiring route method args: %O', routeParams);
          routeData.routes.push({
            metadata: {
              ...routeMetadata,
              responseHandler: routeMetadata.responseHandler,
            },
            propertyKey: route,
            arguments: routeParams,
          });
          const routerWiredMiddlewares = [
            // Initialize the request context
            (ctx: RequestContext, next: MiddlewareNext) => {
              // Create a request-scoped IoC container and mount it to the `ctx`
              ctx.container = createRequestContainer();
              ctx.container.bind<any>(CONTAINER_KEY.Ctx).toConstantValue(ctx);
              // Mounting internal request object
              ctx.__bwcx__ = {
                controller,
                route,
                controllerReflectionContextContainer: Reflector.createReflectionContextContainer(
                  ctx.container,
                  controller,
                ),
                routeReflectionContextContainer: Reflector.createReflectionContextContainer(
                  ctx.container,
                  controller,
                  route,
                ),
              };
              return next();
            },
            exceptionHandlerRegister.getMiddleware(),
            ...pluginMiddlewares,
            ...globalMiddlewares,
            ...globalGuards,
            // File uploading middleware
            this.multerOptions !== null
              ? this._multerInstance.fields(uploadFields)
              : (_, next) => next(),
            validationRegister.getMiddleware(contract.req, contract.resp),
            ...controllerMiddlewares,
            ...controllerGuards,
            ...routeMiddlewares,
            ...routeGuards,
          ];
          (routeMetadata.routeAliases || []).forEach((alias) => {
            router[alias.method.toLowerCase()](
              alias.path,
              ...routerWiredMiddlewares,
              // Wrap the routing method
              async (ctx: RequestContext) => {
                // Inject routing meta
                ctx.routeMeta = alias.meta;
                // Calculate the values of all parameters to be injected
                const paramValues = routeParams.map((routeParam) =>
                  AppUtils.getRouteParam(ctx, routeParam),
                );
                const c = getDependency(controller, ctx.container);
                const res = await c[route].apply(c, paramValues);
                ctx.__bwcx__.route_return = res;
                const usingResponseHandler =
                  routeResponseHandler || controllerResponseHandler || defaultResponseHandler;
                const finalRes = usingResponseHandler ? await usingResponseHandler(res, ctx) : res;
                if (finalRes) {
                  ctx.body = finalRes;
                }
              },
            );
          });
        });
        routerData.push(routeData);
        routers.push(router);
      });
    }
    const wiredData = { router: routerData };
    this.container.bind(CONTAINER_KEY.WiredData).toConstantValue(wiredData);
    routers.forEach((router) => {
      this.instance.use(router.routes()).use(router.allowedMethods());
    });
    return wiredData;
  }

  /**
   * Lifecycle: after application framework wiring.
   */
  protected afterWire(): void | Promise<void> {}

  /**
   * Lifecycle: before application launch.
   *
   * Here you can asynchronously initialize the required services and mount them to the app instance.
   */
  protected beforeStart(): void | Promise<void> {}

  /**
   * Lifecycle: after application launch.
   *
   * The startup log can be printed or reported here.
   */
  protected afterStart(): void | Promise<void> {}

  /**
   * Lifecycle: before the application is exited.
   */
  protected beforeExit(): void | Promise<void> {}

  /**
   * Bootstrap application
   *
   * bootstrapping process:
   * - beforeInit
   * - init
   * - beforeWire
   * - wire
   * - afterWire
   *
   * @returns Wired data
   */
  public async bootstrap(): Promise<IAppWiredData> {
    appDebug('running lifecycle: beforeInit');
    await this.beforeInit();
    appDebug('running lifecycle: init');
    await this._init();
    // Inject `beforeExit`
    this._exitHook.addHook(this.beforeExit.bind(this));
    appDebug('running lifecycle: beforeWire');
    await this.beforeWire();
    appDebug('running lifecycle: wire');
    const wiredData = await this._wire();
    // Inject `beforeExit` of plugins
    for (const pluginInstance of this._pluginInstances) {
      if (pluginInstance.beforeExit) {
        this._exitHook.addHook(pluginInstance.beforeExit.bind(pluginInstance));
      }
    }
    appDebug('running lifecycle: afterWire');
    // Inject `afterWire` of plugins
    for (const pluginInstance of this._pluginInstances) {
      if (pluginInstance.afterWire) {
        await pluginInstance.afterWire();
      }
    }
    await this.afterWire();
    return wiredData;
  }

  /**
   * Start the application.
   *
   * Starting process：
   * - beforeStart
   * - start
   * - afterStart
   *
   * @returns The listening http server
   */
  public async start(): Promise<Server> {
    appDebug('running lifecycle: beforeStart');
    // Inject `beforeStart` of plugins
    for (const pluginInstance of this._pluginInstances) {
      if (pluginInstance.beforeStart) {
        await pluginInstance.beforeStart();
      }
    }
    await this.beforeStart();
    appDebug('running lifecycle: start');
    const listenPromise = new Promise((resolve, _reject) => {
      this.server = this.instance.listen(this.port, this.hostname, this.backlog, () => {
        resolve(true);
      });
    });
    await listenPromise;
    appDebug('running lifecycle: afterStart');
    await this.afterStart();
    return this.server;
  }

  /**
   * Start the application manually.
   *
   * Starting process：
   * - beforeStart
   * - handleStart
   * - afterStart
   */
  public async startManually(handleStart: () => Promise<void>): Promise<void> {
    appDebug('running lifecycle: beforeStart');
    // Inject `beforeStart` of plugins
    for (const pluginInstance of this._pluginInstances) {
      if (pluginInstance.beforeStart) {
        await pluginInstance.beforeStart();
      }
    }
    await this.beforeStart();
    appDebug('running lifecycle: start');
    await handleStart();
    appDebug('running lifecycle: afterStart');
    await this.afterStart();
  }

  /**
   * Stop the application.
   */
  public async stop() {
    const closePromise = new Promise((resolve, _reject) => {
      if (!this.server) {
        resolve(true);
      }
      this.server.close(() => {
        resolve(true);
      });
    });
    await closePromise;
  }

  /**
   * Clear the application.
   */
  public clear() {
    this._exitHook.clear();
    this._pluginInstances.splice(0, this._pluginInstances.length);
    delete this._multerInstance;
    delete this.server;
    delete this.instance;
    this.container.unbind(CONTAINER_KEY.App);
    this.container.unbind(CONTAINER_KEY.AppConfig);
    this.container.unbind(CONTAINER_KEY.WiredData);
  }
}

/**
 * Inject application object.
 * @decorator {property, constructor parameter}
 */
export function InjectApp() {
  return Inject(CONTAINER_KEY.App);
}

/**
 * Inject application config object.
 * @decorator {property, constructor parameter}
 */
export function InjectAppConfig() {
  return Inject(CONTAINER_KEY.AppConfig);
}
