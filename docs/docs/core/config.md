# 配置

## 介绍

配置能力实际基于依赖注入，且和其他内置能力一样，不对目录结构有任何约束，你可以在任何位置组织配置。

对于每种配置，推荐实现一个配置基类，如果该配置可能根据当前环境有不同配置项，可以扩展配置基类。框架会根据当前环境加载正确的配置类。

使用 `@Config()` 装饰器标注配置类。

```typescript
import { Config } from 'bwcx-ljsm';

@Config()
export default class DbConfig {
  host = '';
  database = 'testdb';
  port = 3306;
  user = 'test';
  pass: string | null = null;
}
```

使用 `when` 和 `override` 定义特定环境的配置类。

```typescript
import { Config } from 'bwcx-ljsm';
import DbConfig from './db.config';

@Config(DbConfig, { when: 'development', override: true })
export default class DbConfigDev extends DbConfig {
  host = '127.0.0.1';
  pass = 'test';
}
```

::: tip
`@Config()` 默认作用域是 `Singleton`。
:::

## 注入配置

需要使用配置时，直接注入基类即可，框架会自动根据环境选用实际对应的类。

由于采用基类作为标识符注入配置，要求所有继承基类的环境配置类不能额外添加基类不存在的属性，所有配置属性必须在基类有默认值。

```typescript {8}
import { Inject } from 'bwcx-core';
import { Controller, Get } from 'bwcx-ljsm';
import DbConfig from '../configs/db/db.config';

@Controller('/user')
export default class UserController {
  constructor(
    @Inject() private dbConfig: DbConfig;
  ) {}

  @Get('/get')
  async getUsers() {
    console.log(this.dbConfig);
    return { rows: [] };
  }
}
```
