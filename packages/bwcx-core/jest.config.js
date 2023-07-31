const { getPackageName, getPackageBaseJestConfig } = require('../../jest.base.config');

const packageName = getPackageName(require('./package.json'));

module.exports = {
  ...getPackageBaseJestConfig(packageName),
};
