import type { Vue, VueConstructor } from 'vue/types/vue';
import type { ErrorHandler } from 'vue-router/types/router';
import { AbstractRouterAction, BwcxClientRoutesMapValue, PartialRawOptions } from 'bwcx-client-vue';

class RouterAction extends AbstractRouterAction {
  public constructor(
    private readonly vueInstance: Vue,
    options: BwcxClientRouterPluginOptions,
    name: string,
  ) {
    super(options.routesMap, name);
  }

  public push(
    options: any,
    rawOptions?: PartialRawOptions,
    onComplete?: Function,
    onAbort?: ErrorHandler,
  ) {
    // @ts-ignore
    this.vueInstance.$router?.push(
      {
        name: this.name,
        ...this.parseOptions(options),
        ...rawOptions,
      },
      onComplete,
      onAbort,
    );
  }

  public replace(
    options: any,
    rawOptions?: PartialRawOptions,
    onComplete?: Function,
    onAbort?: ErrorHandler,
  ) {
    // @ts-ignore
    this.vueInstance.$router?.replace(
      {
        name: this.name,
        ...this.parseOptions(options),
        ...rawOptions,
      },
      onComplete,
      onAbort,
    );
  }
}

class RouterActionFactory {
  static getAction(vueInstance: Vue, options: BwcxClientRouterPluginOptions, name: string) {
    return new RouterAction(vueInstance, options, name);
  }
}

export interface BwcxClientRouterPluginOptions {
  routesMap: Map<string, BwcxClientRoutesMapValue>;
}

function initRouter(options: BwcxClientRouterPluginOptions) {
  return function () {
    // @ts-ignore
    this.$$router = {
      to: (name: string) => {
        // @ts-ignore
        return RouterActionFactory.getAction(this, options, name);
      },
    };
  };
}

export class BwcxClientRouterPlugin {
  static install(Vue: VueConstructor, options: BwcxClientRouterPluginOptions) {
    Vue.mixin({
      beforeCreate: initRouter(options),
    });
  }
}
