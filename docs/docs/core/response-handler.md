# 响应处理器

对于业务需要自定义响应格式的情形，bwcx 内建提供了响应处理器，接口只需要返回符合 DTO 约束的对象，然后交由响应处理器处理。

## 定义响应处理器

```typescript
import { ResponseHandler, IBwcxResponseHandler, RequestContext } from 'bwcx-ljsm';

@ResponseHandler()
export default class GeneralResponseHandler implements IBwcxResponseHandler {
  // response 参数为路由方法的返回
  handle(response: any, ctx: RequestContext) {
    // 可以对原返回内容包装，用此对象作为响应
    return {
      success: true,
      code: 0,
      data: response,
    };
  }
}
```

如上示例，当我们的路由方法返回 `{ rows: [] }` 时，经过响应处理器，最终的响应体将变为：

```json
{
  "success": true,
  "code": 0,
  "data": {
    "rows": []
  }
}
```

## 配置默认响应处理器

如果应用中大部分接口都有固定的响应格式，则建议配置默认响应处理器。

```typescript {4}
import GeneralResponseHandler from './response-handlers/general.response-handler';

class OurApp extends App {
  protected responseHandler = GeneralResponseHandler;
}
```

## 在控制器中使用响应处理器

对于个别接口需要定制响应的情形，可以单独针对控制器或路由方法应用响应处理器。

首先，我们需要为我们的响应处理器类创建一个自定义装饰器，这将方便我们在控制器上应用它。

```typescript {16-18}
import { ResponseHandler, IBwcxResponseHandler, RequestContext, createResponseHandlerDecorator } from 'bwcx-ljsm';

@ResponseHandler()
export default class GeneralResponseHandler implements IBwcxResponseHandler {
  // response 参数为路由方法的返回
  handle(response: any, ctx: RequestContext) {
    // 可以对原返回内容包装，用此对象作为响应
    return {
      success: true,
      code: 0,
      data: response,
    };
  }
}

export function GeneralResponse() {
  return createResponseHandlerDecorator(GeneralResponseHandler);
}
```

在控制器上使用装饰器：

```typescript {6,10}
import { Inject } from 'bwcx-core';
import { Controller, Get } from 'bwcx-ljsm';
import { GeneralResponse } from '../response-handlers/general.response-handler';

@Controller('/user')
@GeneralResponse()
export default class UserController {
  @Get('/get')
  // 或只给指定路由方法应用响应处理器
  @GeneralResponse()
  async getUsers() {
    return {
      rows: await this.userService.getUsers(),
    };
  }
}
```

::: tip
响应处理器只有一个会生效，其匹配优先级为 `路由方法 > 控制器 > 全局`。

请勿在同一位置多次应用响应处理器（如在同一个路由方法上应用多个响应处理器），这可能会导致预期外的结果。
:::
