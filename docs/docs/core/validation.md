# 数据校验

## 介绍

bwcx 集成了数据校验能力，并和 OOP 结合，以提供统一的开发体验。

我们提倡面向接口的请求、响应做校验，这将有助于我们实现诸如接口文档生成、client 调用等特性。

对于每个需要校验的接口，都应定义相关 DTO（数据传输对象）。我们使用 [class-validator](https://github.com/typestack/class-validator) 库驱动校验，因此 DTO 的定义可以参考它的文档。

我们还提供 `@FromParam()`、`@FromQuery()`、`@FromBody()` 这几个装饰器，用来指明字段的来源。对开发者来说，请求数据是自动拼装好的一个对象，不再需要关心字段从哪来，并分别校验。

安装依赖：`npm i -S class-validator class-transformer`

```typescript
import { FromQuery } from 'bwcx-common';
import { Type } from 'class-transformer';
import { IsDate, IsInt, Length, Max, Min, ValidateNested } from 'class-validator';

export class UserDTO {
  @IsInt()
  userId: number;

  @Length(2, 20)
  username: string;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;
}

export class GetUsersReqDTO {
  @FromQuery()
  @Length(2, 20)
  username: string;

  @FromQuery()
  @IsInt()
  @Min(1)
  userId: number;
}

export class GetUsersRespDTO {
  @Type(() => UserDTO)
  @ValidateNested()
  rows: UserDTO[];
}
```

::: tip
DTO 不应注入其他的类，也不应该带有业务逻辑的复杂校验，这部分校验应该在 Controller 层完成。DTO 仅包含纯粹的字段合法性校验。
:::

## 在控制器中使用

使用 `@Contract()` 装饰器指定该接口的请求和响应类型约束。如果为空，则传 `null`。

同时，可以使用 `@Data()` 装饰器获取校验通过的请求对象。如果校验不通过，则抛出 `ValidationException` 异常。关于如何处理异常，参见 [异常处理](/core/exception.md)。

```typescript {8-9}
import { Inject } from 'bwcx-core';
import { Controller, Data, Get, Contract } from 'bwcx-ljsm';
import { GetUsersReqDTO, GetUsersRespDTO } from './user.dto';

@Controller('/user')
export default class UserController {
  @Get('/get')
  @Contract(GetUsersReqDTO, GetUsersRespDTO)
  async getUsers(@Data() data: GetUsersReqDTO): Promise<GetUsersRespDTO> {
    console.log('data', data);
    return { rows: [] };
  }
}
```

::: tip
在 App 中可以通过配置 `validation` 属性来实现仅开发环境校验响应。
:::
