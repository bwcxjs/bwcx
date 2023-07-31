import { App, IBwcxGuard } from '@/index';
import { Guard, UseGuards, UseGuardsOr } from '@/guard';
import { Controller, Get, InjectCtx } from '@/web';
import supertest from 'supertest';
import { Server } from 'http';

describe('guard', () => {
  let server: Server;

  afterEach((done) => {
    server?.listening && server.close(done);
  });

  test('guard should work', async () => {
    const onError = jest.fn().mockImplementation((err) => err.name);

    @Guard()
    class TestGuardFail implements IBwcxGuard {
      canPass(ctx) {
        return false;
      }
    }

    @Controller()
    class TestController {
      @InjectCtx()
      ctx;

      @Get('/test')
      test() {
        return {};
      }
    }

    class TestApp extends App {
      protected globalGuards = [TestGuardFail];
      afterWire() {
        this.instance.on('error', onError);
      }
    }
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    const resp = await request.get('/test');
    expect(resp.status).toEqual(500);
    expect(onError).toHaveReturnedWith('GuardNotPassException');
  });

  test('UseGuards decorator should work', async () => {
    const runInGuard = jest.fn();
    const onError = jest.fn().mockImplementation((err) => err.name);

    @Guard()
    class TestGuardPass implements IBwcxGuard {
      canPass(ctx) {
        runInGuard();
        return true;
      }
    }

    @Guard()
    class TestGuardFail implements IBwcxGuard {
      canPass(ctx) {
        runInGuard();
        return false;
      }
    }

    @Controller()
    @UseGuards(TestGuardPass)
    class TestController {
      @InjectCtx()
      ctx;

      @Get('/controllerGuardOnly')
      controllerGuardOnly() {
        return {};
      }

      @Get('/routeGuard')
      @UseGuards(TestGuardFail)
      routeGuard() {
        return {};
      }
    }

    class TestApp extends App {
      afterWire() {
        this.instance.on('error', onError);
      }
    }
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/controllerGuardOnly');
    expect(resp.status).toEqual(200);
    resp = await request.get('/routeGuard');
    expect(resp.status).toEqual(500);
    expect(onError).toHaveReturnedWith('GuardNotPassException');
    expect(runInGuard).toBeCalledTimes(3);
  });

  test('UseGuardsOr decorator should work', async () => {
    const runInGuard = jest.fn();
    const onError = jest.fn().mockImplementation((err) => err.name);

    @Guard()
    class TestGuardPass implements IBwcxGuard {
      canPass(ctx) {
        runInGuard();
        return true;
      }
    }

    @Guard()
    class TestGuardFail implements IBwcxGuard {
      canPass(ctx) {
        runInGuard();
        return false;
      }
    }

    @Controller()
    class TestController {
      @InjectCtx()
      ctx;

      @Get('/test')
      @UseGuardsOr(TestGuardFail, TestGuardPass)
      test() {
        return {};
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/test');
    expect(resp.status).toEqual(200);
    expect(runInGuard).toBeCalledTimes(2);
  });
});
