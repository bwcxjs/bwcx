export type AllowedRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface IBwcxApiRequestAdaptorArgs<T = undefined> {
  method: AllowedRequestMethod;
  url: string;
  data: any;
  headers?: Record<string, string>;
  extraOpts?: T;
  metadata: {
    name: string;
    method: string;
    path: string;
    req: Function | null;
    resp: Function | null;
  };
}
