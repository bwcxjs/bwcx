import { resetContainer } from './src/di/utils';

global.afterEach(() => {
  resetContainer();
});
