import { getContainer, ProviderScope } from '@/di/utils';
import { createCustomProvideDecoratorFactory } from '@/di/decorators';

describe('di/decorators.ts', () => {
  test('createCustomProvideDecoratorFactory should work', () => {
    const container = getContainer();

    const beforeProvide = jest.fn();
    const afterProvide = jest.fn();
    function Service(id?) {
      return createCustomProvideDecoratorFactory(
        {
          scope: ProviderScope.Singleton,
          when: true,
          override: true,
        },
        {
          beforeProvide,
          afterProvide,
        },
      )({ id });
    }

    @Service(Symbol.for('id'))
    class A {}

    expect(container.get(Symbol.for('id'))).toBeInstanceOf(A);
    expect(beforeProvide).toBeCalledWith(A, {
      id: Symbol.for('id'),
      scope: ProviderScope.Singleton,
      condition: true,
      override: true,
    });
    expect(afterProvide).toBeCalledWith(A, {
      id: Symbol.for('id'),
      scope: ProviderScope.Singleton,
      condition: true,
      override: true,
    });
  });
});
