# 快速上手

bwcx 是一个基于 Koa 的轻量 Web 开发框架，遵从面向对象、声明式开发等理念，旨在帮助开发者构建高开发效率、易维护的应用。

bwcx 取自中文「不忘初心」的拼音首字母。

:::warning 注意
bwcx 的设计和实现完成于 2021 年，其基于 TypeScript 传统装饰器，并不兼容 tc39 的 Stage 3 装饰器提案（对应 TypeScript 5.0 的默认装饰器）。如果你的 TypeScript 版本默认使用新版装饰器，你需要调整配置使用传统装饰器或使用低版本 TypeScript。

我们暂时没有计划支持新装饰器，这是因为 Stage 3 提案缺失部分重要特性（如参数装饰器）。
:::

## 初见

初始化一个 TypeScript 项目并安装依赖：

`npm i -S bwcx-common bwcx-core bwcx-ljsm`

修改 `tsconfig.json`，确保其中 `"experimentalDecorators": true, "emitDecoratorMetadata": true` 均已设置。或使用一个简单的入门配置：

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "commonjs",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

新建一个 ts 文件，如 `index.ts`：

```typescript
import { App, Controller, Get } from 'bwcx-ljsm';

@Controller()
class HomeController {
  @Get('/')
  hello() {
    return { hello: 'bwcx' };
  }
}

class OurApp extends App {
  protected port = 3000;

  afterStart() {
    console.log(`🚀 A bwcx app is listening on http://localhost:${this.port}`);
  }
}

const app = new OurApp();
app.bootstrap().then(() => {
  app.start();
});
```

这样就可以了！如果你已经全局安装了 `ts-node` 和 `typescript`，则可以无需编译直接运行你的应用：`ts-node index.ts`，之后你可以尝试在浏览器访问：<http://localhost:3000/>。

## 稍稍规范

随着功能增多，你的应用可能会渐渐变得复杂，需要更好的组织代码。不要担心，我们可以把 Controller 独立出来，放在任何位置。让我们重新组织一下目录和文件：

```typescript
// src/controllers/home.ts

import { Controller, Get } from 'bwcx-ljsm';

@Controller()
export default class HomeController {
  @Get('/')
  hello() {
    return { hello: 'bwcx' };
  }
}
```

然后在入口的 App 配置扫描，这将让我们的 Controller 和应用本身没有任何显式依赖关系：

```typescript {6-9}
// src/index.ts

import { App } from 'bwcx-ljsm';

class OurApp extends App {
  // 这是 Node.js 的特殊变量，表示当前文件所在目录
  protected baseDir = __dirname;
  // 配置要扫描的文件（基于 baseDir），这样你散落在各处的文件会被扫描引用到
  protected scanGlobs = ['./**/*.(j|t)s', '!./**/*.d.ts'];
  protected port = 3000;

  afterStart() {
    console.log(`🚀 A bwcx app is listening on http://localhost:${this.port}`);
  }
}

const app = new OurApp();
app.scan();
app.bootstrap().then(() => {
  app.start();
});
```

看上去很😎！框架内建的扫描机制可以让你任意组织目录，一切随你所好。

接下来，你的 Controller 逻辑可能越来越复杂，甚至需要复用一些逻辑，这时可以把 Controller 内的业务逻辑抽离出去成为一个服务类：

```typescript
// src/services/common.ts

import { Service } from 'bwcx-ljsm';

@Service()
export default class CommonService {
  public sayHello(to: string) {
    return { hello: to };
  }
}
```

修改下原来的 Controller：

```typescript {9-11}
// src/controllers/home.ts

import { Controller, Get } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import CommonService from '../services/common';

@Controller()
export default class HomeController {
  // 在这里，我们把服务类直接弄进来使用，你暂时不用去理解它是如何实例化的
  @Inject()
  private commonService: CommonService;

  @Get('/')
  hello() {
    return this.commonService.sayHello('bwcx');
  }
}
```

大功告成！可以尝试重新运行下你的应用：`ts-node src/index.ts`。

## 加点乐子

对于一些公共的请求逻辑，中间件是一个很有效的解决方案。现在我们尝试加一个简单的日志，让我们能从控制台上看到请求日志。

新增一个中间件类：

```typescript
// src/middlewares/log.ts

import {
  IBwcxMiddleware,
  Middleware,
  MiddlewareNext,
  RequestContext,
} from 'bwcx-ljsm';

@Middleware()
export default class LogMiddleware implements IBwcxMiddleware {
  use(ctx: RequestContext, next: MiddlewareNext) {
    console.log(`req: ${ctx.url}`);
    return next();
  }
}
```

这是经过规范化的中间件类，看上去很熟悉？没错，其实 `use` 方法和 Koa 的中间件是一样的。因此你也可以很容易把任何 Koa 中间件改造成 bwcx 兼容的中间件。

先给我们的 hello 路由应用一下中间件：

```typescript {14}
// src/controllers/home.ts

import { Controller, Get, UseMiddlewares } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import CommonService from '../services/common';
import LogMiddleware from '../middlewares/log';

@Controller()
export default class HomeController {
  @Inject()
  private commonService: CommonService;

  @Get('/')
  @UseMiddlewares(LogMiddleware)
  hello() {
    return this.commonService.sayHello('bwcx');
  }
}
```

重启应用，发起一个请求，可以看到控制台上成功打印出了 `req: /` 日志。

中间件除了可以应用于单独的路由或 Controller 下的所有路由，也可以全局应用。像我们刚才的日志中间件，应该具有足够的普适性。于是我们把刚才 Controller 上的中间件代码删掉，转到 App 上去添加：

```typescript {10}
// src/index.ts

import { App } from 'bwcx-ljsm';
import LogMiddleware from './middlewares/log';

class OurApp extends App {
  protected baseDir = __dirname;
  protected scanGlobs = ['./**/*.(j|t)s', '!./**/*.d.ts'];
  protected port = 3000;
  protected globalMiddlewares = [LogMiddleware];

  afterStart() {
    console.log(
      `🚀 A bwcx app is listening on http://localhost:${this.port}`,
    );
  }
}

const app = new OurApp();
app.scan();
app.bootstrap().then(() => {
  app.start();
});
```

这样一来，我们的日志中间件就在全局生效了。即使新增路由也一样奏效。

不过，我们并不满足于此。假设我们需要为路由 `/secret` 添加校验，只允许特定用户访问：

```typescript
// src/controllers/home.ts

import { Controller, Get } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import CommonService from '../services/common';

@Controller()
export default class HomeController {
  @Inject()
  private commonService: CommonService;

  @Get('/')
  hello() {
    return this.commonService.sayHello('bwcx');
  }

  @Get('/secret')
  secret() {
    return { secretWord: '若你困于无风之地，我将奏响高天之歌' };
  }
}
```

现在我们那需要加一个校验，只让合法身份的用户可以访问这个路由。别着急去写中间件，我们有更好的：

```typescript
// src/guards/random.ts

import { Guard, IBwcxGuard, RequestContext } from 'bwcx-ljsm';

@Guard()
export default class RandomGuard implements IBwcxGuard {
  canPass(ctx: RequestContext) {
    return Math.random() < 0.5;
  }
}
```

我们实现了一个守卫，它的功能正如它的名字一样，随机让一半请求通过。

在路由方法上加入这个守卫：

```typescript {19}
// src/controllers/home.ts

import { Controller, Get, UseGuards } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import CommonService from '../services/common';
import RandomGuard from '../guards/random';

@Controller()
export default class HomeController {
  @Inject()
  private commonService: CommonService;

  @Get('/')
  hello() {
    return this.commonService.sayHello('bwcx');
  }

  @Get('/secret')
  @UseGuards(RandomGuard)
  secret() {
    return { secretWord: '若你困于无风之地，我将奏响高天之歌' };
  }
}
```

好了，测试一下，大成功。使用守卫后，果然请求有大概一半的概率被拦截了。但你会发现，失败时框架返回了 `Internal Server Error`。

其实，守卫校验不通过时，会抛出一个 `GuardNotPassException`，框架设计时为了帮助开发者解耦，提供了统一的异常处理，逻辑异常、调用异常等是不提倡在 Controller 内自行包装响应的。要使用它，需要为异常定义一个异常处理器：

```typescript
// src/exception-handlers/guard.ts

import {
  ExceptionHandler,
  GuardNotPassException,
  IBwcxExceptionHandler,
  RequestContext,
} from 'bwcx-ljsm';

// 声明我们要处理 `GuardNotPassException` 这类异常
@ExceptionHandler(GuardNotPassException)
export default class GuardExceptionHandler implements IBwcxExceptionHandler {
  catch(error: GuardNotPassException, ctx: RequestContext) {
    ctx.status = 403;
    ctx.body = 'Forbidden';
  }
}
```

似乎和中间件/守卫很像？没错，框架为各种可扩展对象都提供了类似的声明方式。现在再试一次，当守卫校验不通过时，已经可以显示友好的错误了。当然，你可以为业务定制需要的异常和异常处理器，这将为构建高可维护性的应用提供良好的基础。

------

至此，我们只展示了 bwcx 的冰山一角，相信你已经对 bwcx 有了一些感觉。欢迎继续探索后面的章节，了解其他功能。
