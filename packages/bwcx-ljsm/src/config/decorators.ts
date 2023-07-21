import { createCustomProvideDecoratorFactory, DependencyIdentifier, ProviderScope } from 'bwcx-core';

/**
 * @decorator {class}
 * @autoProvide {singleton scope}
 */
export function Config(id?: DependencyIdentifier, options: { when?: string | boolean; override?: boolean } = {}) {
  return createCustomProvideDecoratorFactory({
    scope: ProviderScope.Singleton,
    when: options.when,
    override: options.override,
  })({ id });
}
