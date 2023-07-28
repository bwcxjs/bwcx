import { createCustomProvideDecoratorFactory, ProviderScope } from 'bwcx-core';

/**
 * @decorator {class}
 * @autoProvide {DeferredTransient scope}
 */
export function ResponseHandler(options: { when?: string | boolean; override?: boolean } = {}) {
  return createCustomProvideDecoratorFactory({
    scope: ProviderScope.DeferredTransient,
    when: options.when,
    override: options.override,
  })();
}
