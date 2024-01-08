# bwcx

轻量、渐进式、面向对象的 Node.js Web 框架。

[参阅文档](https://bwcxjs.github.io/bwcx/) 以快速上手和查阅 API。

也可以直接使用下列功能强大的模板来创建项目：
- [bwcx-vue3-ssr-template](https://github.com/bwcxjs/bwcx-vue3-ssr-template)：使用了 bwcx 一体化开发能力，基于 Vue 3 的全栈模板

## 基本安装

```sh
npm i -S bwcx-common bwcx-core bwcx-ljsm
```

## 特性概览

### 轻量的 OOP Web 开发

```typescript
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

### 依赖注入

```typescript
@Provide()
export default class MyService {
  @Inject()
  private formatUtil: FormatUtil;

  // 或使用构造器注入
  constructor(private formatUtil: FormatUtil) {}

  public getStr() {
    return this.formatUtil.formatString('foo');
  }
}
```

### 中间件

```typescript
@Middleware()
export default class LogMiddleware implements IBwcxMiddleware {
  use(ctx: RequestContext, next: MiddlewareNext) {
    console.log(`req: ${ctx.url}`);
    return next();
  }
}

@Controller()
@UseMiddlewares(LogMiddleware) // 作用于全部路由
export default class HomeController {
  @Get('/')
  @UseMiddlewares(LogMiddleware) // 作用于单个路由
  hello() {
    return 'world';
  }
}
```

### 守卫

```typescript
@Guard()
export default class RandomGuard implements IBwcxGuard {
  canPass(ctx: RequestContext) {
    return Math.random() < 0.5;
  }
}

@Controller()
@UseGuards(RandomGuard) // 作用于全部路由
export default class HomeController {
  @Get('/')
  @UseGuards(RandomGuard) // 作用于单个路由
  hello() {
    return 'world';
  }
}
```

### 异常处理

```typescript
@ExceptionHandler(Exception)
export default class GlobalExceptionHandler implements IBwcxExceptionHandler {
  catch(error: Exception, ctx: RequestContext) {
    ctx.status = 500;
    ctx.body = {
      msg: 'Internal Server Error',
    };
  }
}
```

### 数据校验

```typescript
export class UserDTO {
  @IsInt()
  userId: number;

  @Length(2, 20)
  username: string;
}

export class GetUsersReqDTO {
  @FromQuery()
  @IsInt()
  @Min(1)
  page: number;
}

export class GetUsersRespDTO {
  @Type(() => UserDTO)
  @ValidateNested()
  rows: UserDTO[];
}

@Controller('/user')
export default class UserController {
  @Get('/get')
  @Contract(GetUsersReqDTO, GetUsersRespDTO)
  getUsers(@Data() data: GetUsersReqDTO): Promise<GetUsersRespDTO> {
    return userService.getUsers(data);
  }
}
```

## 谁在使用

<img src="./assets/logo-WeChat.png" style="width: 250px" alt="logo-wechat" />
