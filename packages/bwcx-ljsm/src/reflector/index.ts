import CONTAINER_KEY from './container-key';
import { Newable, isConstructor } from 'bwcx-common';
import { Container, Injectable, Inject } from 'bwcx-core';

export * from './decorators';

interface IReflectionContext {
  target: Newable;
  propertyKey?: string | symbol;
}

@Injectable()
export class Reflector {
  public static createReflectionContextContainer(
    baseContainer: Container,
    targetCtorOrObject: Newable | Object,
    propertyKey?: string | symbol,
  ) {
    let target: Newable;
    if (isConstructor(targetCtorOrObject)) {
      target = targetCtorOrObject as Newable;
    } else if (targetCtorOrObject.constructor) {
      target = targetCtorOrObject.constructor as Newable;
    } else {
      throw new Error('Target is not a constructor');
    }
    const container = baseContainer.createChild();
    container.bind(CONTAINER_KEY.ReflectionContext).toConstantValue({
      target,
      propertyKey,
    });
    container.bind(CONTAINER_KEY.Reflector).to(Reflector).inTransientScope();
    return container;
  }

  public constructor(
    @Inject(CONTAINER_KEY.ReflectionContext)
    private readonly context: IReflectionContext,
  ) {}

  public getContext() {
    return this.context;
  }

  public getMetadata<T>(metadataKey: any): T {
    return Reflect.getMetadata(metadataKey, this.context.target, this.context.propertyKey);
  }

  public getOwnMetadata<T>(metadataKey: any): T {
    return Reflect.getOwnMetadata(metadataKey, this.context.target, this.context.propertyKey);
  }
}
