# 依赖注入

## 介绍

依赖注入是面向对象中管理依赖的常用手段，它可以很好地帮助我们解决类与类之间的依赖管理问题，无需操心类之间复杂的依赖关系。当你的类需要任何其他类的实例作为依赖项时，只需声明即可。在底层，我们提供了一个集中式管理依赖的容器（也被称为控制反转容器），当你的类实例化时，它会递归计算并将所有需要的依赖项备妥，最后注入到对象中。当然，你的类也是由它负责实例化的。

我们提供了依赖注入作为底层能力。你可以在几乎所有的类中使用依赖注入来更好的组织代码。

对一个类使用 `@Provide()` 装饰器以声明它可以被其他类注入，并自动被容器托管。

```typescript
import { Provide } from 'bwcx-core';

@Provide()
export default class FormatUtil {
  public formatString(str: string) {
    return `str: ${str}`;
  }
}
```

在其他类中使用 `@Inject()` 注入依赖，容器会帮我们自动解析依赖关系并实例化：

```typescript
import { Inject, Provide } from 'bwcx-core';
import FormatUtil from './format.util';

@Provide()
export default class DemoService {
  @Inject()
  private formatUtil: FormatUtil;

  // 也可以使用构造器注入
  constructor(@Inject() formatUtil: FormatUtil) {
    this.formatUtil = formatUtil;
  }

  public getStr() {
    return this.formatUtil.formatString('foo');
  }
}
```

## 依赖标识符

`@Provide()` 支持传入参数来指定依赖标识符。类似地，`@Inject()` 也支持指定依赖标识符。

标识符可以是 `string`、`symbol` 或类，一旦指定标识符，那么注入的时候必须使用相同的标识符，否则依赖将无法找到。默认情况下，容器将自动选择被装饰/被声明为类型的类作为标识符。

```typescript {3,12}
import { Inject, Provide } from 'bwcx-core';

@Provide({ id: 'format'})
export class FormatUtil {
  public formatString(str: string) {
    return `str: ${str}`;
  }
}

@Provide()
export class DemoService {
  @Inject('format')
  formatUtil: FormatUtil;

  public getStr() {
    return this.formatUtil.formatString('foo');
  }
}
```

### 作用域

你可以指定依赖的作用域，使得应用的生命周期和实例化时机相应改变。作用域有以下几种：
- `ProviderScope.Singleton`（单例作用域，默认）：托管在全局容器，在整个应用的生命周期只会实例化一次，之后将使用已实例化的对象
- `ProviderScope.Transient`（瞬态作用域）：托管在全局容器，每次注入都会实例化一个新的对象
- `ProviderScope.Deferred`（请求作用域）：托管在请求作用域容器，在请求链路中是单例，整个请求只实例化一次
- `ProviderScope.DeferredTransient`（瞬态请求作用域）：托管在请求作用域容器，在请求链路中是瞬态，每次注入都会实例化一个新的对象

```typescript {3}
import { Provide, ProviderScope } from 'bwcx-core';

@Provide({ scope: ProviderScope.Transient })
export class FormatUtil {
  public formatString(str: string) {
    return `str: ${str}`;
  }
}
```

::: tip
请求作用域的依赖可以注入其他瞬态和单例的依赖，但瞬态和单例的依赖无法注入请求作用域的依赖。这是因为，请求作用域上的依赖实际被托管在一个仅在请求开始时才会创建的子容器中。
:::

### 条件注入和依赖重写

有时可能需要按条件注入依赖，如实现基于环境的配置。框架也提供了简洁的支持，只有满足 bool 表达式或符合环境（`env.NODE_ENV`）时才会注入：

```typescript
@Provide({ id: 'myConfig', when: 'development' })
export class MyConfigDev {
  public rpcPort = 8080;
}

@Provide({ id: 'myConfig', when: 'production' })
export class MyConfigProd {
  public rpcPort = 8081;
}
```

当然，更多情况下，我们更习惯于定义一个默认设置，只在某个环境下覆盖部分字段，这种时候可以使用依赖重写，当 `when` 的条件满足时将重写默认依赖：

```typescript
@Provide()
export class MyConfig {
  public rpcPort = 8080;
}

@Provide({ id: MyConfig, when: 'production', override: true })
export class MyConfigProd extends MyConfig {
  public rpcPort = 8081;
}
```

## 编程式接口

通过编程式接口可以动态的控制提供和获取依赖。

例如，绑定一个常量到容器：

```typescript
import { provideConst } from 'bwcx-core';

provideConst({
  id: 'hello',
  value: 'world',
});
```

除此之外，还可以绑定类（`provideClass`）或函数（`provideFunction`）。需要注意的是，除了类以外，其他类型在容器中始终是单例作用域。

也支持手动从容器中查找依赖：

```typescript
import { getDependency } from 'bwcx-core';

const dep = getDependency(id);
```

## 基于接口编程

在很多设计模式指导中，经常提及基于接口而非实现编程。在依赖注入中实践基于接口编程将变得十分容易。你既可以将类型声明为接口，而标识符指定为具体实现类；也可以完全和实现类解耦，使用接口来获取依赖。对于后者，由于 TypeScript 现阶段的实现，使用时需要注意接口的声明方式。

声明接口：

```typescript
// 由于 TypeScript 接口在运行期不存在，因此需要定义一个同名的实体变量（推荐 symbol）
export const ISomeService = Symbol('ISomeService');

export interface ISomeService {
  getList(): Promise<any>;
}
```

基于接口实现：

```typescript
import { Provide } from 'bwcx-core';
import { ISomeService } from './some.interface';

// 在 Provide 时指定标识符为接口
@Provide({ id: ISomeService })
export default class SomeService implements ISomeService {
  async getList() {
    // ...
  }
}
```

按接口注入：

```typescript
import { Inject, Provide } from 'bwcx-core';
import { ISomeService } from './some.interface';

@Provide()
export default class DemoService {
  // 以接口作为标识符注入
  @Inject(ISomeService)
  // 或者指定具体的实现类，但可以放心，类型声明还是接口
  // @Inject(SomeService)
  someService: ISomeService;
}
```

::: tip
如果一个接口或标识符对应存在多个实现类，则此时注入将出现 `Ambiguous match found` 错误。尝试使用条件注入或依赖重写以保证依赖唯一。
:::

## 限制

所有使用 `@Provide` 或其他声明装饰器的类必须位于模块的顶级，不能由函数动态地创建类。如果需要动态创建并绑定，请使用编程式接口（如 `provideClass`）向容器绑定依赖。

## 参考

bwcx 的依赖注入能力由 [Dainty DI](https://github.com/dreamerblue/dainty-di) 驱动，你可以参考它的文档来了解更多。
