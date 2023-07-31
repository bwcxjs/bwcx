import 'reflect-metadata';
import { FromBody, FromParam, FromQuery, IsFile } from '@/decorators';
import COMMON_METADATA_KEY from '@/metadata-key';

describe('decorators.ts', () => {
  test('should validation decorators works', () => {
    class A {
      @FromParam()
      param1;

      @FromQuery()
      query1;

      @FromBody()
      body1;

      @FromBody()
      @IsFile()
      file1: any;

      @FromBody()
      @IsFile()
      file2: any[];

      @FromBody()
      @IsFile(5)
      file3: any[];
    }
    const validationFields = Reflect.getMetadata(COMMON_METADATA_KEY.ValidationFields, A);
    const validationFileFields = Reflect.getMetadata(COMMON_METADATA_KEY.ValidationFileFields, A);
    expect(validationFields).toContainEqual({
      type: 'param',
      property: 'param1',
    });
    expect(validationFields).toContainEqual({
      type: 'query',
      property: 'query1',
    });
    expect(validationFields).toContainEqual({
      type: 'body',
      property: 'body1',
    });
    expect(validationFileFields).toContainEqual({
      property: 'file1',
      isArray: false,
      maxCount: 1,
    });
    expect(validationFileFields).toContainEqual({
      property: 'file2',
      isArray: true,
      maxCount: undefined,
    });
    expect(validationFileFields).toContainEqual({
      property: 'file3',
      isArray: true,
      maxCount: 5,
    });
  });
});
