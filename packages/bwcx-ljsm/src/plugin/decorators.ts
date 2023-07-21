import { createCustomProvideDecoratorFactory, ProviderScope } from 'bwcx-core';

/**
 * @decorator {class}
 * @autoProvide {transient scope}
 */
export function Plugin(options: { when?: string | boolean; override?: boolean } = {}) {
  return createCustomProvideDecoratorFactory({
    scope: ProviderScope.Transient,
    when: options.when,
    override: options.override,
  })();
}
