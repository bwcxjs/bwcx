import METADATA_KEY from '../../metadata-key';
import CONTAINER_KEY from '../../container-key';
import { createCustomProvideDecoratorFactory, ProviderScope, getContainer } from 'bwcx-core';
import { Newable } from 'bwcx-common';

export interface ControllerOptions {
  priority?: number;
  when?: string | boolean;
  override?: boolean;
}

/**
 * @decorator {class}
 * @autoProvide {Deferred scope}
 * @param path
 */
export function Controller(path?: string, options: ControllerOptions = {}) {
  return createCustomProvideDecoratorFactory(
    {
      scope: ProviderScope.Deferred,
      when: options.when,
      override: options.override,
    },
    {
      afterProvide(target: Newable) {
        Reflect.defineMetadata(METADATA_KEY.ControllerPath, path, target);
        if (options?.priority) {
          Reflect.defineMetadata(METADATA_KEY.ControllerPriority, options.priority, target);
        }
        getContainer().bind(CONTAINER_KEY.Controllers).toConstructor(target);
      },
    },
  )();
}
