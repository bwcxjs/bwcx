import { createCustomProvideDecoratorFactory, ProviderScope } from 'bwcx-core';

/**
 * @decorator {class}
 * @autoProvide {request-transient scope}
 */
export function ResponseHandler(options: { when?: string | boolean; override?: boolean } = {}) {
  return createCustomProvideDecoratorFactory({
    scope: ProviderScope.DeferredTransient,
    when: options.when,
    override: options.override,
  })();
}
