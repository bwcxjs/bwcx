import type { ErrorHandler, Route } from 'vue-router/types/router';
import { PartialRawOptions } from 'bwcx-client-vue';

export interface BwcxVueRouterActions<RP = undefined> {
  push(options?: RP, rawOptions?: PartialRawOptions): Promise<Route>;
  push(options?: RP, rawOptions?: PartialRawOptions, onComplete?: Function, onAbort?: ErrorHandler): void;
  replace(options?: RP, rawOptions?: PartialRawOptions): Promise<Route>;
  replace(
    options?: RP,
    rawOptions?: PartialRawOptions,
    onComplete?: Function,
    onAbort?: ErrorHandler,
  ): void;
  formatUrl(options?: RP): string;
}
