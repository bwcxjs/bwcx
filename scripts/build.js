const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');

fs.removeSync(path.resolve('dist'));
fs.removeSync(path.resolve('tsconfig.tsbuildinfo'));
try {
  const { stdout } = execa.sync('tsc', ['-b', 'tsconfig.json']);
  stdout && console.log(stdout);
} catch (e) {
  console.error(e);
  process.exit(1);
}
fs.copySync('package.json', path.resolve('dist', 'package.json'));
fs.copySync('README.md', path.resolve('dist', 'README.md'));
