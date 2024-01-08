import { Newable } from 'bwcx-common';
import { RenderMethodKind } from './enums';

export interface BwcxClientRoutesMapValue {
  path: string;
  routeProps: Newable | undefined;
  renderMethod: RenderMethodKind | undefined;
}

export interface PartialRawOptions {
  hash?: string;
}
