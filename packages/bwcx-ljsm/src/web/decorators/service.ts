import { createCustomProvideDecoratorFactory, DependencyIdentifier, ProviderScope } from 'bwcx-core';

/**
 * @decorator {class}
 * @autoProvide {Deferred scope}
 * @param id
 */
export function Service(id?: DependencyIdentifier, options: { when?: string | boolean; override?: boolean } = {}) {
  return createCustomProvideDecoratorFactory({
    scope: ProviderScope.Deferred,
    when: options.when,
    override: options.override,
  })({ id });
}
