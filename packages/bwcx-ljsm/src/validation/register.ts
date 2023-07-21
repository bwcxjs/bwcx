import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import type { MiddlewareNext, RequestContext } from '..';
import { ValidationException } from './validation.exception';
import type { IValidationConfig } from '.';
import { getDtoMetadata } from 'bwcx-common';
import type { Newable } from 'bwcx-common';

export default class ValidationRegister {
  private config: IValidationConfig;

  constructor(config: IValidationConfig) {
    this.config = {
      disabled: false,
      skipReqValidation: false,
      skipRespValidation: false,
      reqTransformer: {
        enableImplicitConversion: true,
      },
      ...config,
    };
  }

  private collectData(ctx: RequestContext, dto: Newable) {
    const { fields: validationFields, fileFields: validationFileFields } = getDtoMetadata(dto);
    let data: any = {};
    validationFields.forEach((field) => {
      const { type, property } = field;
      switch (type) {
        case 'param':
          data[property] = ctx.params[property];
          break;
        case 'query':
          data[property] = ctx.query[property];
          break;
        case 'body':
          const fileField = validationFileFields.find((f) => f.property === property);
          if (fileField) {
            data[property] = fileField.isArray ? ctx.files[property] : ctx.files[property]?.[0];
          } else {
            // @ts-ignore
            data[property] = ctx.request.body[property];
          }
          break;
      }
    });
    return data;
  }

  public getMiddleware(req: any, resp: any) {
    return async (ctx: RequestContext, next: MiddlewareNext) => {
      if (req) {
        const reqData = this.collectData(ctx, req);
        const reqInstance: any = plainToClass(req, reqData, this.config.reqTransformer);
        const validateErrors = await validate(reqInstance, this.config.reqValidator);
        if (validateErrors.length > 0) {
          throw new ValidationException('req', validateErrors);
        } else {
          ctx.__bwcx__.data = reqInstance;
        }
      }
      await next();
      if (!this.config.skipRespValidation && resp) {
        const respData = ctx.__bwcx__.route_return;
        if (!respData) {
          throw new ValidationException('resp', [], `resp is ${respData}`);
        }
        const respInstance: any = plainToClass(resp, respData, this.config.respTransformer);
        const validateErrors = await validate(respInstance, this.config.respValidator);
        if (validateErrors.length > 0) {
          throw new ValidationException('resp', validateErrors);
        }
      }
    };
  }
}
