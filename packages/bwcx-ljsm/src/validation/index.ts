import { ClassTransformOptions } from 'class-transformer';
import { ValidatorOptions } from 'class-validator';

export * from './validation.exception';

export interface IValidationConfig {
  disabled?: boolean;
  skipReqValidation?: boolean;
  skipRespValidation?: boolean;
  reqTransformer?: ClassTransformOptions;
  reqValidator?: ValidatorOptions;
  respTransformer?: ClassTransformOptions;
  respValidator?: ValidatorOptions;
}
