# bwcx-api-client

A bwcx api client (client runtime and generator).

## Setup

```sh
npm i -S bwcx-common bwcx-api bwcx-api-client class-transformer urlcat-fork
```

## How to use

### Define DTO

You have to define DTO and declare the data source via `@FromParam`, `@FromQuery` or `@FromBody` decorator so that generator can collect request data.

```typescript
import { FromParam, FromBody, IsFile } from 'bwcx-common';
import { IsString } from 'class-validator'; // add validation rule if you want

export class SomeReqDTO {
  @FromParam()
  @IsString()
  id: string;

  @FromBody()
  name: string;

  @FromBody()
  @IsFile()
  avatar: any;
}
```

### Define route

You have to use `@Api` decorator set to declare your route method as an API:

```typescript
class SomeController {
  @Api.Summary('A test API') // It's required to detect whether a route should be collected to generate API Client
  @Api.Description('This API performs test logic and return a mocked data')
  @Post()
  @Contract(SomeReqDTO, SomeRespDTO)
  public test(@Data() data: SomeReqDTO): SomeRespDTO {
    return ...
  }
}
```

### Add generator

If you are using bwcx as server framework, you can invoke generator in `afterStart` hook, else you should collect route data manually and pass it to generator:

```typescript
import { ApiClientGenerator } from 'bwcx-api-client/generator';
import BWCX_CONTAINER_KEY from 'bwcx-ljsm/container-key';

class OurApp extends App {
  async afterStart() {
    const routeData = getDependency<IAppWiredData>(BWCX_CONTAINER_KEY.WiredData, this.container).router;
    const apiClientGenerator = new ApiClientGenerator(
      {
        outFilePath: 'api-client.ts',
        enableExtraReqOptions: true,
      },
      routeData,
    );
    await apiClientGenerator.generate();
  }
}
```

### Next steps

After API Client is generated, you can new it and directly call server API route.
