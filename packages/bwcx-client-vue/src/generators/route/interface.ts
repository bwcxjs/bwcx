export interface AnalysedRoute {
  name: string;
  path: string; // string literal with quotes
  location: string;
  routeProps: string;
  otherOptions: string;
  priority: string;
  childOf: string; // string literal with quotes
  renderMethod: string;
  // added properties
  fullPath?: string;
  children?: AnalysedRoute[];
  parent?: AnalysedRoute;
  _ignored?: boolean;
}
