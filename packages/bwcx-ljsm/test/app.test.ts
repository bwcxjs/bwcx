import { App } from '@/index';
import { mockProcessExit } from 'jest-mock-process';

describe('App', () => {
  test('app should start server', async (done) => {
    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    const server = await app.start();
    expect(server.listening).toBe(true);
    server.close(done);
  });

  test('app life cycle should work', async (done) => {
    class TestApp extends App {
      beforeInit() {}
      beforeWire() {}
      afterWire() {}
      afterStart() {}
      beforeExit() {}
    }
    const app = new TestApp();
    const beforeInit = jest.spyOn(app, 'beforeInit');
    const beforeWire = jest.spyOn(app, 'beforeWire');
    const afterWire = jest.spyOn(app, 'afterWire');
    const afterStart = jest.spyOn(app, 'afterStart');
    const beforeExit = jest.spyOn(app, 'beforeExit');
    await app.bootstrap();
    expect(beforeInit).toBeCalled();
    expect(beforeWire).toBeCalled();
    expect(afterWire).toBeCalled();
    const server = await app.start();
    expect(afterStart).toBeCalled();
    const mockExit = mockProcessExit();
    process.listeners('SIGTERM').forEach((exit) => {
      exit('SIGTERM');
    });
    setTimeout(() => {
      mockExit.mockRestore();
      expect(beforeExit).toBeCalled();
      server.close(done);
    }, 200);
  });

  test('app should stop server', async () => {
    class TestApp extends App {}
    const app = new TestApp();
    await app.bootstrap();
    const server = await app.start();
    await app.stop();
    expect(server.listening).toBe(false);
  });
});
