import * as webpack from 'webpack';
import * as path from 'path';
import ESLintPlugin from 'eslint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

module.exports = () => {
  /** @type {import('webpack').Configuration} */
  const devConfig = {
    mode: 'development',

    devtool: 'eval',
    // devtool: 'eval-source-map',

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
      filename: 'game.js',
      chunkFilename: 'game-library.js',
    },

    plugins: [
      new ESLintPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),

      new webpack.DefinePlugin({
        'process.env': '{}',
        PRODUCTION: JSON.stringify(false),
        VERSION: JSON.stringify('3.0.0'), // TODO Update from package.json
      }),
    ],
  };

  return devConfig;
};
