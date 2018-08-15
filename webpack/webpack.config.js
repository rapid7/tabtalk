const path = require('path');
const webpack = require('webpack');

const ROOT = path.join(__dirname, '..');

module.exports = {
  cache: true,

  devtool: '#cheap-module-source-map',

  entry: './src/index.js',

  externals: {
    react: {
      amd: 'react',
      commonjs: 'react',
      commonjs2: 'react',
      root: 'React',
    },
    'react-dom': {
      amd: 'react-dom',
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      root: 'ReactDOM',
    },
  },

  mode: 'development',

  module: {
    rules: [
      {
        enforce: 'pre',
        include: [path.resolve(ROOT, 'src')],
        loader: 'eslint-loader',
        options: {
          configFile: '.eslintrc',
          emitError: true,
          failOnError: true,
          failOnWarning: true,
          formatter: require('eslint-friendly-formatter'),
        },
        test: /\.js$/,
      },
      {
        include: [path.resolve(ROOT, 'dev'), path.resolve(ROOT, 'src')],
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
        test: /\.js$/,
      },
    ],
  },

  output: {
    filename: 'tabtalk.js',
    library: 'tabtalk',
    libraryTarget: 'umd',
    path: path.join(ROOT, 'dist'),
    umdNamedDefine: true,
  },

  plugins: [new webpack.EnvironmentPlugin(['NODE_ENV'])],
};
