# 服务

## 基本使用

使用服务来实现业务逻辑。服务和控制器一样，会被 IoC 容器托管在请求作用域。一个服务可以被控制器或其他服务注入使用。

```typescript
import { RequestContet, Service, Ctx } from 'bwcx-ljsm';

@Service()
export default class UserService {
  constructor(
    // Service 中也可以访问 ctx
    @Ctx() private ctx: RequestContext;
  ) {}

  async getUsers() {
    // 查询用户
  }
}
```

在 Controller 中注入服务：

```typescript {8}
import { Inject } from 'bwcx-core';
import { RequestContet, Controller, Ctx, Get } from 'bwcx-ljsm';

@Controller('/user')
export default class UserController {
  constructor(
    @Ctx() private ctx: RequestContext,
    @Inject() private userService: UserService,
  ) {}

  @Get('/get')
  async getUsers() {
    return {
      rows: await this.userService.getUsers(),
    };
  }
}
```

::: tip
`@Service()` 默认作用域是 `Deferred`。
:::
