import * as webpack from 'webpack';
import * as path from 'path';
import ESLintPlugin from 'eslint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import Dotenv from 'dotenv-webpack';

module.exports = () => {
  /** @type {import('webpack').Configuration} */
  const devConfig = {
    mode: 'development',

    target: 'web',

    devtool: 'inline-source-map',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
    },

    plugins: [
      new ESLintPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new webpack.HotModuleReplacementPlugin(),
      new Dotenv(),
    ],
  };

  return devConfig;
};
