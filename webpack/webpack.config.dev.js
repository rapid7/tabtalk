'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const defaultConfig = require('./webpack.config');

const PORT = 3000;
const ROOT = path.join(__dirname, '..');

module.exports = Object.assign({}, defaultConfig, {
  devServer: {
    compress: true,
    contentBase: path.join(ROOT, 'dist'),
    hot: false,
    lazy: false,
    overlay: true,
    port: PORT,
    stats: {
      colors: true,
      progress: true,
    },
  },

  entry: [path.join(ROOT, 'dev', 'index.js')],

  externals: undefined,

  module: Object.assign({}, defaultConfig.module, {
    rules: defaultConfig.module.rules.map((loaderObject) => {
      if (loaderObject.loader === 'eslint-loader') {
        return Object.assign({}, loaderObject, {
          options: Object.assign({}, loaderObject.options, {
            emitError: undefined,
            failOnWarning: false,
          }),
        });
      }

      if (loaderObject.loader === 'babel-loader') {
        return Object.assign({}, loaderObject, {
          options: Object.assign({}, loaderObject.options, {
            plugins: ['transform-runtime'],
          }),
        });
      }

      return loaderObject;
    }),
  }),

  output: Object.assign({}, defaultConfig.output, {
    publicPath: `http://localhost:${PORT}/`,
  }),

  plugins: [...defaultConfig.plugins, new HtmlWebpackPlugin(), new webpack.NamedModulesPlugin()],
});
