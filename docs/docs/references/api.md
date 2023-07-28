# API

### provideClass(options: ProvideAPIOptions): void

编程式绑定一个类到容器（请求链路中动态绑定的请求作用域依赖将无法解析）。

### provideFunction(options: ProvideAPIOptions): void

编程式绑定一个函数到容器。

### provideConst(options: ProvideAPIOptions): void

编程式绑定一个常量到容器。

### getDependency\<T\>(id: string | symbol | Newable, container?: Container): T

从容器获取依赖。

### createReqParamDecorator(handler: (ctx) => any): ParameterDecorator

创建请求参数装饰器，传入一个自定义的 handler 来决定被装饰参数应如何取值。

### createGuardGroup(opt): IGuardGroup

创建一个 `<key, Decorator<Guard>>` 的守卫组。

### getRouteMetadata(controller: Newable, route: string): IRouteMetadata

获取路由元数据。
