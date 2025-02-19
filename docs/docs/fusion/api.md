# API 一体化调用

## API 声明

目前 bwcx 提供了 API 声明组件，通过装饰器形式声明 API 的属性，用于前后端一体化开发接口调用。

安装依赖：`npm i -S bwcx-api`

使用 `@Api` 装饰器为路由方法声明 API 相关属性，相关路由方法必须使用 `@Contract()` 声明请求/响应 DTO，否则无法用于后续的接口生成：

```typescript {10-11}
import { Inject, Controller, Data, Get, Contract } from 'bwcx-ljsm';
import {
  GetUsersReqDTO,
  GetUsersRespDTO,
} from 'your-common/modules/user/user.dto';
import { Api } from 'bwcx-api';

@Controller('/user')
export default class UserController {
  @Api.Summary('获取用户列表')
  @Api.Description('通过查询参数获取用户列表数据')
  @Get('/get')
  @Contract(GetUsersReqDTO, GetUsersRespDTO)
  async getUsers(@Data() data: GetUsersReqDTO): Promise<GetUsersRespDTO> {
    console.log('data', data);
    return { rows: [] };
  }
}
```

## 配置客户端调用

bwcx 提供了 `api-client`，为前后端一体化开发提供近乎无感的客户端调用代码生成。借助这个能力，你可以做到写完服务端接口，保存，即可在前端通过 `api.method` 像调用本地函数一般直接调用服务端接口，而无需手动处理复杂的 url 拼接、参数填充、数据类型转换等问题。

### 配置代码生成

安装依赖：`npm i -S bwcx-api-client`

在服务端 App 上简单修改，加入代码生成逻辑：

```typescript
import { App, getDependency } from 'bwcx-ljsm';
import BWCX_CONTAINER_KEY from 'bwcx-ljsm/container-key';
import { ApiClientGenerator } from 'bwcx-api-client/generator';

class OurApp extends App {
  // ...

  afterStart() {
    if (process.env.NODE_ENV === 'development') {
      const apiClientGenerator = new ApiClientGenerator(
        {
          /** 生成路径 */
          outFilePath: path.join(this.baseDir, './common/api/api-client.ts'),
          /** 是否在文件头附加额外的自定义导入语句 */
          prependImports: [],
          /** 是否开启请求时额外参数，用于调用时传递额外的参数，可以改变 client 的行为 */
          enableExtraReqOptions: true,
        },
        getDependency<IAppWiredData>(BWCX_CONTAINER_KEY.WiredData, this.container).router,
      );
      await apiClientGenerator.generate();
    }
  }
}
```

每次你的应用在开发时重启，都会自动生成一次 api-client，生成文件简化示例如下：

```typescript
import { GetUsersReqDTO, GetUsersRespDTO } from 'your-common/modules/user/user.dto';

export class ApiClient<T = undefined> {
  /**
   * 获取用户列表
   *
   * @description 通过查询参数获取用户列表数据
   * @param {GetEnterpriseLogoMainColorReqDTO} req The request data (compatible with ReqDTO).
   * @param {T} opts Extra request options.
   * @returns {GetEnterpriseLogoMainColorRespDTO} The response data (RespDTO).
   */
  public getUsers(req: GetEnterpriseLogoMainColorReqDTO, opts?: T): Promise<GetEnterpriseLogoMainColorRespDTO> {}
}
```

api-client 是自动生成的接口调用代码，其使用最朴素的 HTTP 调用，内部自动根据 DTO 定义完成拼接参数、处理响应等步骤，对外暴露为和 Controller 路由方法几乎一样的函数调用。

### 客户端调用

确保安装了运行时所需依赖：`npm i -S urlcat-fork`

有了 api-client，各类客户端（Web 前端、小程序等）都可以直接调用服务端接口。为了保证各端调用的灵活性和兼容性，api-client 不会内置实现请求代码，也不依赖任何请求库，不过你只需要简单的适配即可封装出用于在客户端上使用的 client，你可以自己处理细节，诸如使用什么请求库、是否有自带参数、是否传递 csrf token 等行为。

还记得之前的响应处理器吗？响应处理器让我们只需要考虑纯粹的数据响应，在外层为响应统一做包装。同样地，客户端接收到请求，要把请求体解析回原始的响应返回（RespDTO），这就需要告诉 client 如何解析响应。因此首先需要定义一个响应解析器：

```typescript
import { AbstractResponseParser } from 'bwcx-api-client';
import { ApiRequestException } from './api-request.exception'; // 可以定义一个异常给客户端使用

export class ResponseParser extends AbstractResponseParser {
  public constructor() {
    super({});
  }

  public parse(resp: any) {
    // 解析响应，等同于接口的响应处理器的反向操作
    if (resp.success) {
      return resp.data;
    }
    throw new ApiRequestException(resp.code, resp.msg);
  }
}
```

生成的 ApiClient 被调用时，会将已经自动处理过的用户请求参数传递给请求适配器函数，已处理参数的数据结构如下所示：

```typescript
{
  method: AllowedRequestMethod;
  url: string;
  /** 请求体，如果是含有文件上传的请求，会返回 FormData 对象 */
  data: any;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 额外请求选项，用户调用 API 时会通过第二个参数传递 */
  extraOpts?: T;
  /** API 元数据 */
  metadata: APIMetadata;
}
```

现在，只需要告诉 ApiClient 我们的自定义请求适配器是什么，它就可以运行了！请求适配器是一个函数，接收刚才提到的参数，并根据参数发起实际 HTTP 请求。以 axios 库为例：

```typescript
import Axios from 'axios';
import { omit } from 'lodash';
import { IBwcxApiRequestAdaptorArgs } from 'bwcx-api-client';
import { ApiClient } from 'path-to-your-original-api-client';
import { ResponseParser } from 'path-to-your-response-parser';

// 这里可以为 client 添加自定义的请求级选项，在调用 API 时作为第二个参数传递
export interface IRequestExtraOpts {
  showTips?: boolean;
}

/** 实现一个请求适配器，接收 ApiClient 提供的参数，并实现发起请求 */
export class RequestAdaptor {
  public request(opts: IBwcxApiRequestAdaptorArgs<IRequestExtraOpts>) {
    const { extraOpts = {}, metadata } = opts;
    const config = omit(opts, 'metadata', 'extraOpts');
    return Axios.request(config)
      .then((response) => {
        // 自定义选项的逻辑
        if (!response.data.success && extraOpts.showTips) {
          tips.err(response.data.msg || '服务异常，请稍候再试');
        }
        // 返回 HTTP 请求的响应数据，之后会交由 `ResponseParser` 处理
        return response.data;
      })
      .catch((err) => {
        if (Axios.isCancel(err)) {
          return console.log('request canceled');
        }
        tips.err('服务异常，请稍候再试');
        throw err;
      });
  }
}

// 拿到可用的 client 对象
export const apiClient = new ApiClient(new RequestAdaptor(), new ResponseParser());
```

最后，enjoy it：

```typescript
import { apiClient } from 'path-to-your-client';

// 直接在客户端上调用，或挂载到组件
const res = await apiClient.getUsers({
  /** 请求参数 */
});
```
