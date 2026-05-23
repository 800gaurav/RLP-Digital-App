const path = require('path');

module.exports = function (api) {
  api.cache(true);

  const expoPackageDir = path.dirname(require.resolve('expo/package.json'));
  const expoPreset = require.resolve('babel-preset-expo', {
    paths: [__dirname, expoPackageDir],
  });

  return {
    presets: [expoPreset],
    plugins: ['./babel-plugin-import-meta-env'],
  };
};
