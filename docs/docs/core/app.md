# 应用

一个应用即是一个继承 App 的类。

## 配置应用

通过覆盖 App 类上的配置属性值来自定义应用，同时，应用还提供多个生命周期以供扩展。完整的应用配置选项可以参考 `IAppConfig`。

```typescript
import { App, IAppConfig } from 'bwcx-ljsm';

class OurApp extends App {
  // 应用根目录
  protected baseDir = __dirname;

  // 需要被容器扫描和装配的文件 glob（基于 `baseDir`，具体概念请参考依赖注入章节）
  protected scanGlobs = [
    './**/*.(j|t)s',
    '!./**/*.d.ts',
  ];

  // 监听端口
  protected port = 3000;

  // 监听 hostname
  protected hostname;

  // 退出超时时间
  protected exitTimeout = 5000;

  // 要加载的插件
  protected plugins = [];

  // 要加载的全局中间件
  protected globalMiddlewares = [];

  // 要加载的全局守卫
  protected globalGuards = [];

  // 默认响应处理器
  protected responseHandler: IAppConfig["responseHandler"];

  // 数据校验选项
  protected validation: IAppConfig["validation"] = {};

  // 应用初始化前
  async beforeInit() {}

  // 应用装配前
  async beforeWire() {}

  // 应用装配完成后
  async afterWire() {}

  // 应用启动前
  async beforeStart() {}

  // 应用成功启动后
  async afterStart() {}

  // 应用退出前
  async beforeExit() {}
}
```

## 引导应用

对于一个实例化的应用对象，调用 `bootstrap()` 以启动引导，应用将自动完成初始化、插件激活、路由装配等流程。所有围绕 `init` 和 `wire` 的生命周期钩子均会被执行。

大多数情况下，你可能会将 Controller 和其他业务逻辑放置在和 App 不同的模块中以更好地组织代码，这时需要先执行依赖扫描（`app.scan()`）以保证引导时所有依赖都已备妥。

```typescript
const app = new OurApp();
app.scan();
app.bootstrap(); // 注意，这是一个异步操作，其会返回应用装配数据
```

## 启动应用

对于已完成引导的应用，调用 `start()` 以启动服务器，所有围绕 `start` 的生命周期钩子均会被执行。另外，在服务器接收到非强制退出信号时，`beforeExit` 钩子会被执行，可以在此进行一些清理工作。其最长等待时间由 `exitTimeout` 配置项决定。

```typescript
app.start(); // 这也是一个异步操作，会返回已监听的 http.Server 对象
```

::: tip
尚不支持多应用，每个进程仅可存在一个被引导的应用。
:::

## 停止应用

你可以手动停止已启动应用，这将会关闭所有连接并关闭监听。

```typescript
app.stop(); // 这还是一个异步操作
```

## 清理应用

在某些时候，你可能要清理 app 实例在装配和启动中带来的副作用（如注册的进程退出钩子），在确保应用已停止后即可执行清理，这对诸如服务端 HMR 等场景可能会有用。需要注意的是，这个操作并不会清理已扫描的依赖，如需重置容器，请使用 `resetContainer()`。

```typescript
app.clear();
```
