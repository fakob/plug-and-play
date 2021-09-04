import * as path from 'path';
import * as webpack from 'webpack';
import ESLintPlugin from 'eslint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

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
          exclude: /node_modules/,
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
      filename: 'main.[hash].js',
      chunkFilename: 'main-library.[contenthash].js',
    },

    plugins: [
      new ESLintPlugin({
        extensions: ['js', 'jsx', 'ts', 'tsx'],
        // emitError: true,
        // emitWarning: true,
        // failOnError: true,
        // failOnWarning: true,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].[hash].css',
      }),
      new webpack.DefinePlugin({
        'process.env': '{}',
        PRODUCTION: JSON.stringify(true),
        VERSION: JSON.stringify('3.0.0'), // TODO Update from package.json
      }),

      new webpack.ProgressPlugin(),
    ],

    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            mangle: true,
            toplevel: true,
            keep_classnames: false,
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
};
