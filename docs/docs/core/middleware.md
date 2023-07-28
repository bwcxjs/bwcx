# 中间件

## 定义中间件

bwcx 支持装载 Koa 式的中间件。要定义一个中间件，需要实现自定义中间件类。

```typescript
import { MiddlewareNext, RequestContext, IBwcxMiddleware, Middleware } from 'bwcx-ljsm';

@Middleware()
export default class LogMiddleware implements IBwcxMiddleware {
  async use(ctx: RequestContext, next: MiddlewareNext) {
    const _start = Date.now();
    try {
      await next();
    } finally {
      console.log(`[${ctx.method} ${ctx.url} ${ctx.status}](${Date.now() - _start}ms)`);
    }
  }
}
```

这里我们实现了一个打印请求日志的中间件类，其必须用 `@Middleware()` 标注以被容器管理。同样地，如有需要，我们可以在类中注入其他依赖。

::: tip
`@Middleware()` 默认作用域是 `DeferredTransient`。
:::

## 使用全局中间件

如果想把中间件应用到全局，可以在 `app.ts` 中声明需要应用的中间件。

```typescript {4}
import LogMiddleware from './middlewares/log.middleware';

class OurApp extends App {
  protected globalMiddlewares = [LogMiddleware];
}
```

## 在控制器中使用中间件

如果想灵活地应用中间件，可以使用 `@UseMiddlewares()` 装饰器，它可以装饰控制器或路由方法，接收一个或多个中间件类参数并按顺序加载它们。

```typescript {6,10}
import { Inject } from 'bwcx-core';
import { Controller, Get, UseMiddlewares } from 'bwcx-ljsm';
import LogMiddleware from '../middlewares/log.middleware';

@Controller('/user')
@UseMiddlewares(LogMiddleware)
export default class UserController {
  @Get('/get')
  // 或只给指定路由方法应用中间件
  @UseMiddlewares(LogMiddleware)
  async getUsers() {
    return { rows: [] };
  }
}
```

## 带参中间件

有时我们需要对中间件使用某些参数初始化或定制行为，类似于中间件工厂。框架提供了带参中间件支持，可以在在装饰位置赋予中间件参数。

首先需要为中间件引入 Reflector，它可以帮助我们读取被装饰类或方法的元数据。这里我们以一个上报中间件为例，需要为接口进行上报，但每个接口要上报的 id 可能不同。

```typescript
import { Optional } from 'bwcx-core';
import { combineDecorators } from 'bwcx-common';
import { MiddlewareNext, RequestContext, IBwcxMiddleware, Middleware, InjectReflector, Reflector, SetMetadata } from 'bwcx-ljsm';

@Middleware()
export default class ReportMiddleware implements IBwcxMiddleware {
  @InjectReflector()
  @Optional()
  reflector?: Reflector;

  async use(ctx: RequestContext, next: MiddlewareNext) {
    // 读取被装饰类或方法上的元数据作为参数来改变中间件行为
    const reportId = this.reflector?.getMetadata<number>('middleware:reportMiddeware:id');
    await next();
    reportSome(reportId);
  }
}

// 为了便于使用，可以创建一个中间件装饰器工厂
export function Report(id: number) {
  // 组合多个装饰器成单个装饰器，和手动应用这些装饰器效果一致
  return combineDecorators([
    // 为被装饰的方法设置元数据，中间件即可读取它
    SetMetadata('middleware:reportMiddeware:id', id),
    UseMiddlewares(ReportMiddleware),
  ]);
}
```

在控制器上使用：

```typescript {7}
import { Controller, Get } from 'bwcx-ljsm';
import { Report } from '../middlewares/report.middleware'

@Controller('/user')
export default class UserController {
  @Get('/get')
  @Report(1)
  async getUsers() {
    return {
      rows: [],
    };
  }
}
```

::: tip
`Reflector` 仅可用于中间件、守卫和响应处理器。
:::
