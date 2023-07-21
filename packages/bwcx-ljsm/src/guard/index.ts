import { UseGuards } from './decorators';
import { IBwcxGuard } from '../interfaces';
import { Newable } from 'bwcx-common';

export * from './decorators';
export * from './guard.exception';

export function createGuardGroup<T extends Record<string | symbol, Newable<IBwcxGuard>>>(
  groupOpts: T,
): Record<keyof T, () => (target: any, propertyKey?: string, descriptor?: any) => void> {
  const group = {};
  Object.keys(groupOpts).forEach((key) => (group[key] = () => UseGuards(groupOpts[key])));
  // @ts-ignore
  return group;
}
