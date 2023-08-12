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

const title = 'Your Plug and Playground';
const imageURL =
  'https://plugandplayground.dev/assets/PlugAndPlayground-Drawing-a-chart.png';
const url = 'https://plugandplayground.dev';
const description =
  'Creative prototyping to explore, transform or visualise data.';
const author = 'a plug and player';

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
        title: `${title}`,
        meta: {
          description: {
            name: 'description',
            content: `${description}`,
          },
          // Google / Search Engine Tags
          title: { itemprop: 'name', content: `${title}` },
          googleDescription: {
            itemprop: 'description',
            content: `${description}`,
          },
          image: { itemprop: 'image', content: `${imageURL}` },
          // Open Graph Meta Tags
          'og:url': { property: 'og:url', content: `${url}` },
          'og:type': { property: 'og:type', content: 'website' },
          'og:title': { property: 'og:title', content: `${title}` },
          'og:description': {
            property: 'og:description',
            content: `${description}`,
          },
          'og:image': { property: 'og:image', content: `${imageURL}` },
          // Twitter Meta Tags
          'twitter:card': { name: 'twitter:card', content: 'summary' },
          'twitter:title': { name: 'twitter:title', content: `${title}` },
          'twitter:description': {
            name: 'twitter:description',
            content: `${description}`,
          },
          'twitter:image': { name: 'twitter:image', content: `${imageURL}` },
          'twitter:creator': { name: 'twitter:creator', content: `${author}` },
        },
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
            to: path.resolve(__dirname, 'dist'),
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
        overlay: {
          runtimeErrors: (error) => {
            if (error.message === 'ResizeObserver loop limit exceeded') {
              return false;
            }
            return true;
          },
        },
      },
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }

        devServer.app.get('/buildInfo', (_, response) => {
          response.send({
            message: 'This is a mock response',
            data: { buildVersion: 'v518', buildTime: '2023-08-11T21:33:54Z' },
          });
        });

        devServer.app.get('/listExamples', (_, response) => {
          response.send({
            files: [
              'Drawing a chart with chartjs.ppgraph',
              'Drawing a line graph from weather API.ppgraph',
              'Drawing example - tixy.ppgraph',
              'Drawing examples.ppgraph',
              'Get API example.ppgraph',
              'Get frames from a video.ppgraph',
              'Get started - Welcome to Plug and Playground.ppgraph',
              'How to share your playgrounds.ppgraph',
              'Node update behaviour example.ppgraph',
              'Shaders example.ppgraph',
              'Tweet filter example v01 - NOT WORKING.ppgraph',
              'Using macros within a function - Get dominant colors.ppgraph',
              'Using macros within a function - Random color array.ppgraph',
              'Using macros within a function - UV texture generator.ppgraph',
              'pixotopePipelineImageSave - NOT WORKING.ppgraph',
              'z For debugging - Missing nodes - sockets - links.ppgraph',
            ],
          });
        });

        devServer.app.get('/listNodeExamples', (_, response) => {
          response.send({
            message: 'This is a mock response',
            data: { files: ['Break.ppgraph', 'Video.ppgraph'] },
          });
        });

        return middlewares;
      },
      proxy: {
        '/dist': '/assets',
      },
    },
  });

  return mergedConfig;
};
