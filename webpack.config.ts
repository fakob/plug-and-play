/* eslint-disable @typescript-eslint/no-var-requires */

import * as path from 'path';

import { merge } from 'webpack-merge';
import { Configuration } from 'webpack';

// plugins
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

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
          type: 'asset/resource',
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        title: 'Your Plug and Playground',
      }),
      new CleanWebpackPlugin(),
      new webpack.ProvidePlugin({
        PIXI: 'pixi.js',
      }),
      new MonacoWebpackPlugin({
        // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
        languages: ['typescript', 'javascript'],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'assets/**',

            // after upgrading packages transformPath throws a typescript error
            // have not found another solution than to ignore it
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            to({ context, absoluteFilename }) {
              return Promise.resolve('assets/[name][ext]');
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

  const mergedConfig = merge(config, envConfig, {
    devServer: {
      allowedHosts: ['localhost', '.csb.app'],
      client: {
        logging: 'info',
        // overlay: false, // to hide the error overlay
      },
    },
  });

  return mergedConfig;
};
