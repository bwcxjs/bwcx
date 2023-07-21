import { plainToClass, ClassTransformOptions } from 'class-transformer';

export abstract class AbstractResponseParser {
  public constructor(private readonly transformOptions: ClassTransformOptions) {}

  public transform<O = any>(respDtoClass: any, resp: any): O {
    if (!respDtoClass) {
      return resp;
    }
    // @ts-ignore
    return plainToClass(
      respDtoClass,
      resp,
      this.transformOptions || {
        enableImplicitConversion: true,
      },
    );
  }

  public pat<O = any>(respDtoClass: any, resp: any): O {
    return this.transform(respDtoClass, this.parse(resp));
  }

  /**
   * Parse request response.
   *
   * @param resp Original response
   * @returns Parsed objects that can be converted to response DTO-compatible objects
   */
  abstract parse(resp: any): any;
}
