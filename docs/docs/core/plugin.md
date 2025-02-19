# 插件

## 介绍

bwcx 支持通过插件扩展框架功能，可以通过引入插件来增强框架功能。

通常使用插件非常简单，只需要使用 `usePlugin()`，传入插件和需要的配置类即可。框架会自动根据环境注入对应的配置类对象到插件中。

```typescript {5}
import SomeBwcxPlugin from 'some-plugin';
import PluginConfig from '/path/to/my-plugin-config';

class OurApp extends App {
  protected plugins = [this.usePlugin(SomeBwcxPlugin, PluginConfig)];
}
```

## 开发插件

要开发插件也十分简单，框架提供了多个应用生命周期和请求扩展点。只需要实现自己的插件类即可。如果需要使用容器能力，框架也提供了容器方法，可以供开发者自行操作容器。

这里我们假定你开发一个独立的插件包，只需初始化一个项目并安装 `bwcx-ljsm` 作为 `devDependencies` 和 `peerDependencies` 即可。

下面，我们将以如何开发一个简单的基于 `TypeORM` 的 ORM 插件为例介绍。其中可能包含部分直接操作容器的 API，可以参考 [InversifyJS](https://github.com/inversify/InversifyJS)。

### 定义插件类

```typescript
// src/container-key.ts

const CONTAINER_KEY = {
  Connection: Symbol.for('bwcx:plugin:orm:Connection'),
};

export default CONTAINER_KEY;
```

```typescript
// src/metadata-key.ts

const METADATA_KEY = {
  EntityModel: Symbol.for('bwcx:plugin:orm:EntityModel'),
};

export default METADATA_KEY;
```

```typescript
// src/index.ts

import { Container, InjectContainer } from 'bwcx-core';
import { IBwcxPlugin, Plugin, RequestContext, MiddlewareNext } from 'bwcx-ljsm';
import CONTAINER_KEY from './container-key';
import { ConnectionOptions } from 'typeorm';

export type OrmConfig = ConnectionOptions;

@Plugin()
export default class OrmPlugin implements IBwcxPlugin {
  @InjectContainer()
  container: Container;

  // 插件激活时。这个过程发生在 `App.wire` 中，将在装配的最初阶段执行每个插件的 `onActivate`
  public async onActivate(config: OrmConfig) {
    console.log('orm plugin on activate');
    const connection = {
      fake: true,
      name: 'default',
      getRepository(entity) {
        console.log('get repository:', entity);
        return {};
      },
    };
    // 将数据库连接对象存放到容器
    this.container.bind(CONTAINER_KEY.Connection).toConstantValue(connection);
  }

  // 提供 App 级别的中间件，并直接挂载到 Koa 实例（`App.instance`）。这个过程发生在 `onActivate` 后
  public getAppMiddleware() {
    return async (ctx: RequestContext, next: MiddlewareNext) => {
      console.log('orm plugin app instance level middleware in');
      await next();
      console.log('orm plugin app instance level middleware out');
    };
  }

  // 提供中间件。插件中间件将在用户指定的全局中间件之前挂载
  public getMiddleware() {
    return async (ctx: RequestContext, next: MiddlewareNext) => {
      console.log('orm plugin middleware in');
      await next();
      console.log('orm plugin middleware out');
    };
  }

  // 应用启动前。插件对生命周期的扩展将在用户扩展之前执行
  public async beforeStart() {}

  // 应用退出前
  public async beforeExit() {}
}
```

插件会在框架装配时激活，在激活时执行插件的 `onActivate` 方法。同时，如果框架需要注册中间件或扩展应用生命周期，都可以提供相应方法。

## 提供自定义装饰器

插件可能需要提供装饰器。以我们的 ORM 插件为例，为了实现用户可以注入实体对应的 Repository，需要对外提供包装实体的 `@EntityModel()` 和供用户注入的 `@InjectRepository()`。

```typescript
// src/decorators.ts

import { Newable } from 'bwcx-common';
import CONTAINER_KEY from './container-key';
import { Entity, EntityOptions } from 'typeorm';
import { inject, tagged } from 'inversify';
import OrmPlugin from '.';

/**
 * 包装实体装饰器。会取得实体的 Repository 绑定到容器
 * @decorator {class}
 */
export function EntityModel(entityOpts?: EntityOptions) {
  return function (target) {
    // 应用 TypeORM @Entity()
    Entity(entityOpts)(target);
    // 在数据库连接创建后才能把对应 Repository 绑定到容器
    // 把所有 Entity 都附加到插件本身的元数据上，以便插件激活并建立数据库连接后，可以对所有 Entity 做处理
    const lastEntityModels = Reflect.getMetadata(METADATA_KEY.EntityModel, OrmPlugin) || [];
    const entityModels = [
      ...lastEntityModels,
      {
        target,
        options: entityOpts,
      },
    ];
    Reflect.defineMetadata(METADATA_KEY.EntityModel, entityModels, OrmPlugin);
  };
}

/**
 * 注入指定实体的 Repository
 * @decorator {property}
 * @param entity
 * @param connectionName
 */
export function InjectRepository(entity: Newable, connectionName = 'default') {
  return function (target, propertyKey: string) {
    const identifier = entity;
    inject(identifier)(target, propertyKey);
    tagged('bwcx:plugin:orm:tag:ConnectionName', connectionName)(target, propertyKey);
  };
}
```

在插件 `onActivate` 中处理 `@EntityModel()` 逻辑：

```typescript
// src/index.ts

@Plugin()
export default class OrmPlugin implements IBwcxPlugin {
  @InjectContainer()
  container: Container;

  // 插件激活时。这个过程发生在 App.wire 中，将在装配的最初阶段执行每个插件的 `onActivate`
  public async onActivate(config: OrmConfig, app: ApplicationInstance) {
    // 建立连接...
    // 处理 @EntityModel() 逻辑
    const entityModels = Reflect.getMetadata(METADATA_KEY.EntityModel, this.constructor) || [];
    for (const entity of entityModels) {
      const { target, options } = entity;
      const identifier = target;
      this.container
        .bind(identifier)
        .toConstantValue(connection.getRepository(target))
        .whenTargetTagged('bwcx:plugin:orm:tag:ConnectionName', connection.name);
    }
  }
}
```
