import { App } from '@/index';
import {
  Body,
  Controller,
  createReqParamDecorator,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@/web';
import supertest from 'supertest';
import { Server } from 'http';

describe('web', () => {
  let server: Server;

  afterEach((done) => {
    server?.listening && server.close(done);
  });

  test('wiring route should work with specified method, path and response', async () => {
    @Controller()
    class TestController {
      @Get('/get')
      testGet() {
        return {
          success: true,
        };
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    const resp = await request.get('/get').set('Accept', 'application/json');
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual({ success: true });
  });

  test('wiring route should work with conditional injection', async () => {
    @Controller(undefined, { when: false })
    class TestController {
      @Get('/get')
      testGet() {
        return {
          success: true,
        };
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    const resp = await request.get('/get').set('Accept', 'application/json');
    expect(resp.status).toEqual(404);
  });

  test('method decorator should work', async () => {
    @Controller()
    class TestController {
      @Get()
      shouldUseMethodName() {
        return {};
      }

      @Post('/post')
      testPost() {
        return {};
      }

      @Put('/put')
      testPut() {
        return {};
      }

      @Patch('/patch')
      testPatch() {
        return {};
      }

      @Delete('/delete')
      testDelete() {
        return {};
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/shouldUseMethodName');
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual({});
    resp = await request.post('/post');
    expect(resp.status).toEqual(200);
    resp = await request.put('/put');
    expect(resp.status).toEqual(200);
    resp = await request.patch('/patch');
    expect(resp.status).toEqual(200);
    resp = await request.delete('/delete');
    expect(resp.status).toEqual(200);
  });

  test('controller decorator should work', async () => {
    @Controller('/path')
    class TestController {
      @Get('/test')
      test() {
        return {};
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/path/test');
    expect(resp.status).toEqual(200);
  });

  test('controller decorator should sort by priority', async () => {
    @Controller('/path', { priority: -1 })
    class AController {
      @Get('/test')
      test() {
        return {
          is: 'A',
        };
      }
    }

    @Controller('/path')
    class BController {
      @Get('/test')
      test() {
        return {
          is: 'B',
        };
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/path/test');
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual({ is: 'B' });
  });

  test('request decorator should work', async () => {
    @Controller()
    class TestController {
      @Get('/param/:id')
      testParam(@Param('id') id: string, @Param() param: any) {
        return {
          id,
          param,
        };
      }

      @Get('/query')
      testQuery(@Query('id') id: string, @Query('name') name: string, @Query() query: any) {
        return {
          id,
          name,
          query,
        };
      }

      @Post('/body')
      testBody(@Body('id') id: string, @Body() body: any) {
        return {
          id,
          body,
        };
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/param/1');
    expect(resp.body).toEqual({
      id: '1',
      param: { id: '1' },
    });
    resp = await request.get('/query?id=1&name=Nahida');
    expect(resp.body).toEqual({
      id: '1',
      name: 'Nahida',
      query: { id: '1', name: 'Nahida' },
    });
    resp = await request.post('/body').send({ id: '1' });
    expect(resp.body).toEqual({
      id: '1',
      body: { id: '1' },
    });
  });

  test('createReqParamDecorator should work', async () => {
    function Ip() {
      return createReqParamDecorator((ctx) => {
        return ctx.ip;
      });
    }

    @Controller()
    class TestController {
      @Get('/test')
      testParam(@Ip() ip: string) {
        return {
          ip,
        };
      }
    }

    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    server = await app.start();

    const request = supertest(server);
    let resp = await request.get('/test');
    expect(resp.body.ip).toMatch(/127\.0\.0\.1$/);
  });
});
