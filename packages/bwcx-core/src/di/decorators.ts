import { DependencyIdentifier, Provide as LibProvide, ProviderScope, DecoratorUtility } from 'dainty-di';

export function Provide(
  opts: {
    id?: DependencyIdentifier;
    scope?: ProviderScope;
    when?: string | boolean;
    override?: boolean;
  } = {},
) {
  let scope: ProviderScope | undefined = undefined;
  switch (opts.scope as string) {
    case 'singleton':
    case 'Singleton':
      scope = ProviderScope.Singleton;
      break;
    case 'transient':
    case 'Transient':
      scope = ProviderScope.Transient;
      break;
    case 'request':
    case 'Request':
    case 'Deferred':
      scope = ProviderScope.Deferred;
      break;
    case 'request-transient':
    case 'RequestTransient':
    case 'DeferredTransient':
      scope = ProviderScope.DeferredTransient;
      break;
  }
  return LibProvide({
    ...opts,
    condition: opts.when,
    scope,
  });
}

export function createCustomProvideDecoratorFactory(
  presetOptions: {
    scope?: ProviderScope;
    when?: string | boolean;
    override?: boolean;
  },
  lifeCycleOptions: {
    beforeProvide?(target: Function, options: any): void;
    afterProvide?(target: Function, options: any): void;
  } = {},
) {
  return DecoratorUtility.createProvideDecoratorFactory(
    {
      scope: presetOptions.scope,
      condition: presetOptions.when,
      override: presetOptions.override,
    },
    lifeCycleOptions,
  );
}

export { Injectable, Inject, MultiInject, Optional, InjectRootContainer as InjectContainer } from 'dainty-di';
