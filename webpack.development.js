const webpack = require('webpack');
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = () => {
  return {
    mode: 'development',

    target: 'web',

    devtool: 'inline-source-map',

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
      new ESLintPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new webpack.HotModuleReplacementPlugin(),
      new Dotenv(),
    ],

    devServer: {
      allowedHosts: ['localhost', '.csb.app'],
      client: {
        logging: 'info',
      },
    },
  };
};
