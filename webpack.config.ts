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
const faviconURL = './assets/favicon-32.png';
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
        {
          test: /\.mdx?$/,
          use: [
            {
              loader: '@mdx-js/loader',
              /** @type {import('@mdx-js/loader').Options} */
              options: {},
            },
          ],
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
        favicon: faviconURL,
      }),
      new CleanWebpackPlugin(),
      new webpack.ProvidePlugin({
        PIXI: 'pixi.js',
      }),
      new MonacoWebpackPlugin({
        // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
        languages: ['json', 'javascript', 'typescript'],
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

  const envConfig = require(
    path.resolve(__dirname, `./webpack.${argv.mode}.ts`),
  )(env);

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
              'Access APIs.ppgraph',
              'Begin with an introduction of Plug and Playground.ppgraph',
              'Draw a line graph from weather API data.ppgraph',
              'Draw charts using chartjs.ppgraph',
              'Draw tixi patterns.ppgraph',
              'Draw using basic examples.ppgraph',
              'Extract video frames.ppgraph',
              'Generate a UV mapping texture.ppgraph',
              'Generate arrays of random colors.ppgraph',
              'Get dominant colors from images.ppgraph',
              'Learn about node update behaviour.ppgraph',
              'Share your playgrounds.ppgraph',
              'Work with shaders.ppgraph',
              'help',
              'nodes',
              'z missing nodes, sockets and links.ppgraph',
              'z test node.ppgraph',
              'z test nodelist.ppgraph',
              'z test pivot, offset and rotation.ppgraph',
            ],
          });
        });

        return middlewares;
      },
      proxy: [
        {
          context: ['/dist'],
          target: '/assets',
        },
      ],
    },
  });

  return mergedConfig;
};
