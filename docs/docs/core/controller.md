# 控制器

## 基本使用

使用控制器根据 url 匹配处理用户请求。

```typescript
import { RequestContext, Controller, Get } from 'bwcx-ljsm';

@Controller('/user')
export default class UserController {
  constructor(
    // 注入请求上下文
    @Ctx() private ctx: RequestContext;
  ) {}

  @Get('/get')
  getUsers() {
    return {
      rows: [
        {
          userId: 1,
          username: 'user1',
          createdAt: new Date(),
        },
        {
          userId: 2,
          username: 'user2',
          createdAt: new Date(),
        },
      ],
    };
  }
}
```

如上所示，我们创建了一个 `UserController` 类，使用装饰器 `@Controller()` 将其标注为一个控制器，并指定其路由前缀为 `/user`。控制器类内所有被 HTTP 方法装饰器标注的方法都将自动注册为路由。

在刚才的例子中，我们声明了一个路由 `/get`，其会被自动注册为 `GET /user/get`，使用 `getUsers` 方法处理。

尝试访问 `http://localhost:3000/user/get`，其将返回一个包含所有用户的 json 数据。

还有其他的 HTTP 方法装饰器可用，如 `@Post()`、`@Put()`、`@Patch()`、`@Delete()` 等。

::: tip
`@Controller()` 默认作用域是 `Deferred`。
:::

::: tip
`@Ctx()` 是 `@InjectCtx()` 的别名。
:::

::: tip
由于依赖扫描顺序是不确定的（更准确地说，业务代码不应该依赖扫描顺序），`@Controller()` 的第二个参数支持传入选项 `{ priority: number }` 来设置控制器优先级（默认为 0），以此改变路由装配顺序。
:::

## 处理参数

我们提供了多个参数装饰器（包括 `@Param()`、`@Query()`、`@Body()`）来直接获取用户请求的参数。

```typescript
import { RequestContext, Controller, Get, Query } from 'bwcx-ljsm';

@Controller('/user')
export default class UserController {
  @Get('/get')
  getUsers(
    @Query() query: any,
    @Query('username') username: string,
  ) {
    console.log(query, username);
    return {
      rows: [
        {
          userId: 1,
          username: 'user1',
          createdAt: new Date(),
        },
        {
          userId: 2,
          username: 'user2',
          createdAt: new Date(),
        },
      ],
    };
  }
}
```

如上示例，被 `@Query()` 装饰器装饰的 query 可以直接取到用户输入的所有 url query。当然也可以通过传入一个路径参数来获取指定的值。这对其他几个参数装饰器也适用。

需要注意的是，使用内置参数装饰器取得的值是原始值，这意味在处理某些固定为 string 类型的参数（如 url query）时，即使其类型被声明为 `number`，实际运行时取值也是原始类型。如要校验并转换参数以确保类型安全，请参见 [数据校验](/core/validation.md)。

::: tip
框架还提供了许多使用的请求参数装饰器，如 `@Header()`、`@Cookie()`、`@FormFile()`、`@Referer` 等。请参见 [装饰器列表](/references/decorators.md#web)。
:::

## 自定义请求参数装饰器

框架提供了 `createReqParamDecorator` 方法供便捷创建定制化装饰器。

```typescript
// 也可以带参数
export function Ip() {
  return createReqParamDecorator((ctx) => {
    return ctx.ip;
  });
}
```

```typescript
@Get('/get')
getUsers(@Ip() ip: string) {
  console.log(ip);
  return {};
}
```
