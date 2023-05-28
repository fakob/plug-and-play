const path = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const main = {
  mode: 'production',

  name: 'main',

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
        test: /\.(js|jsx|ts|tsx)$/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
        exclude: [/node_modules/, /ffmpeg\.worker\.js$/],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].chunk.js',
    clean: true,
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
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
      emitError: false,
      emitWarning: false,
      failOnError: false,
      failOnWarning: false,
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[fullhash].css',
    }),
    new Dotenv({ systemvars: true }),

    new webpack.ProgressPlugin(),
  ],

  optimization: {
    usedExports: true,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: true,
          toplevel: true,
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
      new CssMinimizerPlugin({
        test: /\.css$/i,
        minimizerOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
      }),
    ],
  },
};

const worker = {
  name: 'worker',
  entry: './src/nodes/draw/ffmpeg.worker.js',
  output: {
    filename: 'ffmpeg.worker.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'dist/',
  },
  target: 'webworker',
  devtool: 'source-map',
  mode: 'development',
  resolve: {
    modules: ['src', 'node_modules'],
    extensions: ['.js', '.ts', '.tsx'],
    plugins: [],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  dependencies: ['main'],
};

module.exports = [main, worker];
