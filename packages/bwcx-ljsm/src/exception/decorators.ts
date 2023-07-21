import METADATA_KEY from '../metadata-key';
import { Newable } from 'bwcx-common';
import { createCustomProvideDecoratorFactory, ProviderScope } from 'bwcx-core';

/**
 * @decorator {class}
 * @autoProvide {singleton scope}
 * @param exception
 */
export function ExceptionHandler(exception: Newable<Error>, options: { when?: string | boolean; override?: boolean } = {}) {
  return createCustomProvideDecoratorFactory(
    {
      scope: ProviderScope.Singleton,
      when: options.when,
      override: options.override,
    },
    {
      afterProvide(target) {
        Reflect.defineMetadata(METADATA_KEY.ExceptionHandler, target, exception);
      },
    },
  )();
}
