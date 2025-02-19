import { ContainerAccessor, DependencyIdentifier } from 'dainty-di';
import { DIUtility } from 'dainty-di';
import { DeferredScopeUtility } from 'dainty-di';

export type { DependencyIdentifier } from 'dainty-di';
export { Container, ProviderScope } from 'dainty-di';
export const getContainer = ContainerAccessor.getRootContainer;
export const resetContainer = ContainerAccessor.resetRootContainer;
export const provideClass = DIUtility.provideClass;
export const provideConst = DIUtility.provideValue;
export const provideFunction = DIUtility.provideValue;
export const getDependency = DIUtility.getDependency;
export const createRequestContainer = DeferredScopeUtility.createDeferredScopeContainer;
export const getRequestScopeProviders = DeferredScopeUtility.getDeferredScopeProvidersById;

export function getIdentifierFromDecorated(
  target: Object,
  propertyKey: string,
  parameterIndex?: number,
  specifiedId?: DependencyIdentifier,
): DependencyIdentifier {
  const id =
    specifiedId ||
    (parameterIndex === undefined
      ? Reflect.getMetadata('design:type', target, propertyKey)
      : Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex]);
  return DIUtility.getResolvedIdentifier(id);
}
