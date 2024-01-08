import type { App } from 'vue';
import {
  AbstractRouterAction,
  BwcxClientRoutesMapValue,
  PartialRawOptions,
} from 'bwcx-client-vue';
import type { Router } from 'vue-router';

class RouterAction extends AbstractRouterAction {
  public constructor(
    private readonly routerContext: { $router: Router },
    options: BwcxClientRouterPluginOptions,
    name: string,
  ) {
    super(options.routesMap, name);
  }

  public push(options: any, rawOptions?: PartialRawOptions) {
    // @ts-ignore
    this.routerContext.$router?.push({
      name: this.name,
      ...this.parseOptions(options),
      ...rawOptions,
    });
  }

  public replace(options: any, rawOptions?: PartialRawOptions) {
    // @ts-ignore
    this.routerContext.$router?.replace({
      name: this.name,
      ...this.parseOptions(options),
      ...rawOptions,
    });
  }
}

class RouterActionFactory {
  static getAction(
    routerContext: { $router: Router },
    options: BwcxClientRouterPluginOptions,
    name: string,
  ) {
    return new RouterAction(routerContext, options, name);
  }
}

export interface BwcxClientRouterPluginOptions {
  routesMap: Map<string, BwcxClientRoutesMapValue>;
}

export class BwcxClientRouterPlugin {
  static install(app: App, options: BwcxClientRouterPluginOptions) {
    app.mixin({
      beforeCreate() {
        const $router = this.$router;
        this.$$router = {
          to: (name) => {
            return RouterActionFactory.getAction({ $router }, options, name);
          },
        };
      },
    });
  }
}
