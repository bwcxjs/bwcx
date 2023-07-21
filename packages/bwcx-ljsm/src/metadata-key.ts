const METADATA_KEY = {
  Controller: Symbol('bwcx:metadata:controller'),
  ControllerPath: Symbol('bwcx:metadata:controllerPath'),
  ControllerPriority: Symbol('bwcx:metadata:controllerPriority'),
  ControllerRoutes: Symbol('bwcx:metadata:controllerRoutes'),
  ControllerMiddlewares: Symbol('bwcx:metadata:controllerMiddlewares'),
  ControllerGuards: Symbol('bwcx:metadata:controllerGuards'),
  ControllerResponseHandler: Symbol('bwcx:metadata:controllerResponseHandler'),
  ControllerRouteMetadata: Symbol('bwcx:metadata:controllerRouteMetadata'),
  ControllerRouteMetadataParsed: Symbol('bwcx:metadata:controllerRouteMetadataParsed'),
  ControllerRouteParams: Symbol('bwcx:metadata:controllerRouteParams'),
  ControllerRouteContract: Symbol('bwcx:metadata:controllerRouteContract'),
  ExceptionHandler: Symbol('bwcx:metadata:exceptionHandlers'),
};

export default METADATA_KEY;
