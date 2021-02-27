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
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = (env, argv) => {
  const config: Configuration = {
    entry: './src/index.tsx',

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      mainFields: ['module', 'main'],
      fallback: { util: require.resolve('util/') },
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
            transformPath(targetPath, absolutePath) {
              const assetsPath = path.resolve(__dirname, 'assets');
              const endpPath = absolutePath.slice(assetsPath.length);

              return Promise.resolve(`assets/${endpPath}`);
            },
          },
        ],
      }),
      new MonacoWebpackPlugin({
        // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
        languages: ['javascript'],
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
