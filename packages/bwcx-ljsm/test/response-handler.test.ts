import { App, IBwcxResponseHandler } from '@/index';
import { Controller, Get, InjectCtx } from '@/web';
import { createResponseHandlerDecorator, ResponseHandler } from '@/response-handler';
import supertest from 'supertest';
import { Server } from 'http';

describe('response handler', () => {
  let server: Server;

  afterEach((done) => {
    server?.listening && server.close(done);
  });

  test('response handler should work', async () => {
    @ResponseHandler()
    class TestResponseHandler implements IBwcxResponseHandler {
      handle(response, ctx) {
        ctx.body = {
          success: true,
          data: response,
        };
      }
    }

    @Controller()
    class TestController {
      @InjectCtx()
      ctx;

      @Get('/test')
      test() {
        return {
          id: 1,
        };
      }
    }

    class TestApp extends App {
      protected responseHandler = TestResponseHandler;
    }
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    const resp = await request.get('/test');
    expect(resp.body).toEqual({
      success: true,
      data: {
        id: 1,
      },
    });
  });

  test('createResponseHandlerDecorator should work', async () => {
    @ResponseHandler()
    class TestResponseHandlerA implements IBwcxResponseHandler {
      handle(response, ctx) {
        ctx.body = {
          success: true,
          handledBy: 'controller',
          data: response,
        };
      }
    }

    @ResponseHandler()
    class TestResponseHandlerB implements IBwcxResponseHandler {
      handle(response, ctx) {
        ctx.body = {
          success: true,
          handledBy: 'route',
          data: response,
        };
      }
    }

    function ControllerResponseHandler() {
      return createResponseHandlerDecorator(TestResponseHandlerA);
    }

    function RouteResponseHandler() {
      return createResponseHandlerDecorator(TestResponseHandlerB);
    }

    @Controller()
    @ControllerResponseHandler()
    class TestController {
      @InjectCtx()
      ctx;

      @Get('/controllerResponseHandlerOnly')
      controllerResponseHandlerOnly() {
        return {
          id: 1,
        };
      }

      @Get('/routeResponseHandler')
      @RouteResponseHandler()
      routeResponseHandler() {
        return {
          id: 1,
        };
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/controllerResponseHandlerOnly');
    expect(resp.body).toEqual({
      success: true,
      handledBy: 'controller',
      data: {
        id: 1,
      },
    });
    resp = await request.get('/routeResponseHandler');
    expect(resp.body).toEqual({
      success: true,
      handledBy: 'route',
      data: {
        id: 1,
      },
    });
  });
});
