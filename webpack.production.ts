import * as path from 'path';
import * as webpack from 'webpack';
import ESLintPlugin from 'eslint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import Dotenv from 'dotenv-webpack';
const CompressionPlugin = require('compression-webpack-plugin');


module.exports = () => {
  return {
    mode: 'production',

    module: {
      rules: [
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
      filename: '[name].[fullhash].js',
      chunkFilename: '[name].[fullhash].chunk.js',
      clean: true,
    },

    plugins: [
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
      new CompressionPlugin({
        algorithm: 'gzip', // Or 'brotliCompress' for Brotli
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
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/](monaco-editor|xlsx)[\\/]/,
            name: 'vendor',
            chunks: 'all',
          },
        },
      },
    },
  };
};
