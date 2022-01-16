/* eslint-disable @typescript-eslint/no-var-requires */

import * as path from 'path';

import { merge } from 'webpack-merge';
import { Configuration } from 'webpack';

// plugins
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

const webpack = require('webpack');

module.exports = (env, argv) => {
  const config: Configuration = {
    entry: './src/index.tsx',

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      mainFields: ['module', 'main'],
      fallback: {
        util: require.resolve('util/'),
        stream: false,
        buffer: false,
      },
    },

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            'css-loader',
          ],
        },
        {
          test: /\.ttf$/,
          use: ['file-loader'],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin(),
      new CleanWebpackPlugin(),
      new webpack.ProvidePlugin({
        PIXI: 'pixi.js',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'assets/**',

            // if there are nested subdirectories , keep the hierarchy

            // after upgrading packages transformPath throws a typescript error
            // have not found another solution than to ignore it
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            transformPath(targetPath, absolutePath) {
              const assetsPath = path.resolve(__dirname, 'assets');
              const endpPath = absolutePath.slice(assetsPath.length);

              return Promise.resolve(`assets/${endpPath}`);
            },
          },
        ],
      }),
    ],
  };

  const envConfig = require(path.resolve(
    __dirname,
    `./webpack.${argv.mode}.ts`
  ))(env);

  const mergedConfig = merge(config, envConfig);

  return mergedConfig;
};
