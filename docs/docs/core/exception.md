# 异常处理

bwcx 完全不介入任何异常的处理，不提供默认行为，用户需要自己处理异常并定制返回。

## 自定义异常

需要继承 `Exception` 类。

```typescript
import { Exception } from 'bwcx-ljsm';

export default class CustomRequestException extends Exception {
  public code: number;

  constructor(code: number) {
    super(`Request error with code ${code}`);
    this.name = 'CustomRequestException';
    this.code = code;
  }
}
```

```typescript
// 抛出自定义异常
throw new CustomRequestException(-1);
```

::: tip
框架也提供了诸如 `ValidationException` 等内置异常。
:::

## 定义异常处理器

对于每种框架内置异常和自定义异常，都需要自行定义异常处理器，决定如何记录错误信息和返回。

需要使用 `@ExceptionHandler()` 装饰器标注并指定需要处理的异常类，同时实现 `IBwcxExceptionHandler` 接口。

```typescript
import { ExceptionHandler, IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import CustomRequestException from '../exceptions/custom-request.exception';

@ExceptionHandler(CustomRequestException)
export default class CustomRequestExceptionHandler implements IBwcxExceptionHandler {
  catch(error: CustomRequestException, ctx: RequestContext) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      msg: 'Internal Server Error',
      code: error.code,
    };
  }
}
```

::: tip
`@ExceptionHandler()` 默认作用域是 `Singleton`。
:::

::: tip
对于未设置异常处理器的异常，框架会向上查找其父类，直到有一种异常可以被处理为止。如果没有任何异常处理器可以处理此异常，则最终会由 web 框架处理。

因此，我们建议总是设置一个用来处理最顶层异常（`Error`）的异常处理器，以保证非预期的异常可以被处理。
:::
