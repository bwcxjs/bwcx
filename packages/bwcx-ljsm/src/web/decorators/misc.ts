import { Inject } from 'bwcx-core';
import CONTAINER_KEY from '../../container-key';

/**
 * @decorator {property, constructor parameter}
 */
export function InjectCtx() {
  return Inject(CONTAINER_KEY.Ctx);
}

export const Ctx = InjectCtx;
