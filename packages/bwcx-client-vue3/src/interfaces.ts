import type { NavigationFailure } from 'vue-router';
import { PartialRawOptions } from 'bwcx-client-vue';

export interface BwcxVueRouterActions<RP = undefined> {
  push(options?: RP, rawOptions?: PartialRawOptions): Promise<NavigationFailure | void | undefined>;
  replace(options?: RP, rawOptions?: PartialRawOptions):Promise<NavigationFailure | void | undefined>;
  formatUrl(options?: RP): string;
}
