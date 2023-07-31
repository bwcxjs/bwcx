import { getDtoMetadata, isConstructor } from '@/utils';
import { FromBody, FromParam, FromQuery, IsFile } from '@/decorators';

describe('utils.ts', () => {
  test('should isConstructor works', () => {
    class A {}
    const a = new A();
    expect(isConstructor(A)).toBe(true);
    expect(isConstructor(a)).toBe(false);
    expect(isConstructor('')).toBe(false);
    expect(isConstructor(1)).toBe(false);
    expect(isConstructor(null)).toBe(false);
    expect(isConstructor(undefined)).toBe(false);
    expect(isConstructor({})).toBe(false);
  });

  test('should getAllDtoMetadataFields works', () => {
    class BaseDTO {
      @FromParam()
      id: string;

      @FromQuery()
      name: string;
    }

    class SomeDTO extends BaseDTO {
      @FromBody()
      age: number;

      @FromBody()
      name: string;

      @FromBody()
      @IsFile()
      avatar: any;
    }

    const baseMetadata = getDtoMetadata(BaseDTO);
    expect(baseMetadata.fields).toEqual([
      { type: 'param', property: 'id' },
      { type: 'query', property: 'name' },
    ]);
    expect(baseMetadata.fileFields.length).toBe(0);

    const someMetadata = getDtoMetadata(SomeDTO);
    expect(someMetadata.fields).toEqual([
      { type: 'param', property: 'id' },
      { type: 'body', property: 'age' },
      { type: 'body', property: 'name' },
      { type: 'body', property: 'avatar' },
    ]);
    expect(someMetadata.fileFields.find((f) => f.property === 'avatar')).not.toBe(undefined);
  });
});
