import { App, IBwcxMiddleware } from '@/index';
import { Controller, Get, InjectCtx, Middleware, UseMiddlewares } from '@/web';
import supertest from 'supertest';
import { Server } from 'http';

describe('middleware', () => {
  let server: Server;

  afterEach((done) => {
    server?.listening && server.close(done);
  });

  test('middleware should work', async () => {
    const before = jest.fn();
    const after = jest.fn();

    @Middleware()
    class TestMiddleware implements IBwcxMiddleware {
      async use(ctx, next) {
        before();
        ctx.add = 1;
        await next();
        after(ctx.add);
      }
    }

    @Controller()
    class TestController {
      @InjectCtx()
      ctx;

      @Get('/test')
      test() {
        return {
          add: this.ctx.add++,
        };
      }
    }

    class TestApp extends App {
      protected globalMiddlewares = [TestMiddleware];
    }
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    const resp = await request.get('/test');
    expect(resp.body).toEqual({ add: 1 });
    expect(before).toBeCalled();
    expect(after).toBeCalledWith(2);
  });

  test('UseMiddlewares decorator should work', async () => {
    @Middleware()
    class TestMiddlewareA implements IBwcxMiddleware {
      async use(ctx, next) {
        ctx.add = 1;
        return next();
      }
    }

    @Middleware()
    class TestMiddlewareB implements IBwcxMiddleware {
      async use(ctx, next) {
        ctx.add = (ctx.add || 0) + 1;
        ctx.status = 201;
        return next();
      }
    }

    @Controller()
    @UseMiddlewares(TestMiddlewareA)
    class TestController {
      @InjectCtx()
      ctx;

      @Get('/controllerMiddlewareOnly')
      controllerMiddlewareOnly() {
        return {
          add: this.ctx.add,
        };
      }

      @Get('/routeMiddleware')
      @UseMiddlewares(TestMiddlewareB)
      routeMiddleware() {
        return {
          add: this.ctx.add,
        };
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/controllerMiddlewareOnly');
    expect(resp.body).toEqual({ add: 1 });
    resp = await request.get('/routeMiddleware');
    expect(resp.status).toEqual(201);
    expect(resp.body).toEqual({ add: 2 });
  });
});
