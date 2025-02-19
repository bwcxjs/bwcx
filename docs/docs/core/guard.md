# 守卫

在接口开发我们中经常涉及到权限校验等情形。对传统 Koa 应用来说，通常只能通过配置前置中间件来复用校验逻辑。bwcx 提供了守卫，可以轻松实现一个用来拦截请求的中间件。

## 自定义守卫

```typescript
import { Guard, IBwcxGuard, RequestContext } from 'bwcx-ljsm';

@Guard()
export default class LoginGuard implements IBwcxGuard {
  canPass(ctx: RequestContext) {
    // 返回一个 boolean，`true` 为通过，`false` 则抛出 `GuardNotPassException` 异常
    // 也可以抛出自定义异常
    return !!ctx.login;
  }
}
```

::: tip
`@Guard()` 默认作用域是 `DeferredTransient`。
:::

## 使用全局守卫

如果想把守卫为应用到全局，可以在 `app.ts` 中声明需要应用的守卫。

```typescript {4}
import LoginGuard from './guards/login.guard';

class OurApp extends App {
  protected globalGuards = [LoginGuard];
}
```

## 在控制器中使用守卫

如果想灵活地应用守卫，可以使用 `@UseGuards()` 装饰器，它可以装饰控制器或路由方法，接收一个或多个守卫类参数并按顺序加载它们。

同时，框架提供了 `@UseGuardsOr()` 装饰器，可以组合多个守卫，当其中有任意一个通过即通过。

```typescript {8,11-14}
import { Inject } from 'bwcx-core';
import { Controller, Get, UseGuards } from 'bwcx-ljsm';
import LoginGuard from '../guards/login.guard';
import IsSelfGuard from '../guards/self.guard';
import AdminGuard from '../guards/admin.guard';

@Controller('/user')
@UseGuards(LoginGuard)
export default class UserController {
  @Get('/get')
  // 或只给指定路由方法应用守卫
  @UseGuards(LoginGuard)
  // 也可以应用或条件组合的守卫
  @UseGuardsOr(IsSelfGuard, AdminGuard)
  async getUsers() {
    return { rows: [] };
  }
}
```

## 守卫组

有时我们可能更习惯把多个封装好的守卫以装饰器形式罗列起来按顺序校验，并可能在多个校验之间穿插一些其他装饰器。bwcx 提供了 `createGuardGroup` 方法，可以创建一个 `<string | symbol, IBwcxGuard>` 的守卫组对象，方便快速取出单个守卫。

```typescript
import { createGuardGroup } from 'bwcx-ljsm/guard';
import LoginGuard from './login.guard';
import IsSelfGuard from './self.guard';
import AdminGuard from './admin.guard';

const Guards = createGuardGroup({
  Login: LoginGuard,
  IsSelf: IsSelfGuard,
  Admin: AdminGuard,
});

export default Guards;
```

在控制器中随意使用：

```typescript {8-9}
import { Inject } from 'bwcx-core';
import { Controller, Get } from 'bwcx-ljsm';
import Guards from '../guards';

@Controller('/user')
export default class UserController {
  @Get('/get')
  @Guards.Login()
  @Guards.IsSelf()
  async getUsers() {
    return { rows: [] };
  }
}
```
