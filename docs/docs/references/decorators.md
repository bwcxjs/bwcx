# 装饰器列表

## 依赖注入

| 装饰器 | 类型 | 描述 |
|-|-|-|
| @Provide() | 类 | 将类标识为可注入并绑定到容器 |
| @Inject() | 属性、构造器参数 | 注入依赖 |
| @MultiInject() | 属性、构造器参数 | 注入多个依赖，数组形式 |
| @Optional() | 属性、构造器参数 | 与 `@Inject()` 配合使用，依赖不存在时注入不会抛出异常 |
| @InjectContainer() | 属性、构造器参数 | 注入主容器实例 |
| @InjectApp() | 属性、构造器参数 | 注入当前的应用实例 |
| @InjectAppConfig() | 属性、构造器参数 | 注入当前的应用配置 |
| @InjectCtx() | 属性、构造器参数 | 注入当前的请求上下文，仅请求作用域的依赖可以使用 |

## 核心组件

| 装饰器 | 类型 | 描述 |
|-|-|-|
| @Config() | 类 | 声明配置类 |
| @Middleware() | 类 | 声明中间件类，自动绑定到容器且作用域为 `DeferredTransient` |
| @UseMiddlewares() | 类、方法 | 声明为控制器或路由方法应用的中间件列表 |
| @Guard() | 类 | 声明守卫类，自动绑定到容器且作用域为 `DeferredTransient` |
| @UseGuards() | 类、方法 | 声明为控制器或路由方法应用的守卫列表 |
| @UseGuardsOr() | 类、方法 | 声明为控制器或路由方法应用的守卫列表，其中有任一一个守卫通过则视为通过 |
| @ResponseHandler() | 类 | 声明响应处理器类，自动绑定到容器且作用域为 `DeferredTransient` |
| @ExceptionHandler() | 类 | 声明异常处理器类，自动绑定到容器且作用域为 `Singleton` |
| @Plugin() | 类 | 声明插件类，自动绑定到容器且作用域为 `Singleton` |

## Web

| 装饰器 | 类型 | 描述 |
|-|-|-|
| @Controller() | 类 | 声明控制器类，自动绑定到容器且作用域为 `Deferred` |
| @Service() | 类 | 声明服务类，自动绑定到容器且作用域为 `Deferred` |
| @Get() | 方法 | 为路由方法设置 HTTP Method 为 GET 的路由 |
| @Post() | 方法 | 为路由方法设置 HTTP Method 为 POST 的路由 |
| @Put() | 方法 | 为路由方法设置 HTTP Method 为 PUT 的路由 |
| @Patch() | 方法 | 为路由方法设置 HTTP Method 为 PATCH 的路由 |
| @Delete() | 方法 | 为路由方法设置 HTTP Method 为 DELETE 的路由 |
| @Head() | 方法 | 为路由方法设置 HTTP Method 为 HEAD 的路由 |
| @Options() | 方法 | 为路由方法设置 HTTP Method 为 OPTIONS 的路由 |
| @All() | 方法 | 为路由方法设置 HTTP Method 为全部的路由 |
| @Param() | 参数 | 声明被装饰参数为请求 url param |
| @Query() | 参数 | 声明被装饰参数为请求 url query |
| @Body() | 参数 | 声明被装饰参数为请求 body |
| @FormFile() | 参数 | 声明被装饰参数为请求的上传文件 |
| @Header() | 参数 | 声明被装饰参数为请求头 |
| @UserAgent() | 参数 | 声明被装饰参数为请求头的 user-agent |
| @Referer() | 参数 | 声明被装饰参数为请求头的 referer |
| @Cookie() | 参数 | 声明被装饰参数为请求头的 cookie |
| @Session() | 参数 | 声明被装饰参数为请求 session |
| @Host() | 参数 | 声明被装饰参数为请求 host |
| @Url() | 参数 | 声明被装饰参数为请求 url |

## 数据校验

| 装饰器 | 类型 | 描述 |
|-|-|-|
| @FromParam() | 属性 | 声明 DTO 字段来源为 url param |
| @FromQuery() | 属性 | 声明 DTO 字段来源为 url query |
| @FromBody() | 属性 | 声明 DTO 字段来源为 body |
| @IsFile() | 属性 | 声明 DTO 字段类型为上传文件 |
| @Contract() | 方法 | 声明路由方法的请求和响应 DTO 以供数据校验 |
| @Data() | 参数 | 声明被装饰参数为已经过校验和转换的数据 |

## 反射

| 装饰器 | 类型 | 描述 |
|-|-|-|
| @InjectReflector() | 属性、构造器参数 | 注入反射器，用于反射获取当前的中间件/守卫/响应处理器被应用到的控制器及其路由方法 |
| @SetMetadata() | 类、方法 | 设置元数据 |
