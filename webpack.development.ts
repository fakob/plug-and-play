import * as webpack from 'webpack';
import * as path from 'path';
import ESLintPlugin from 'eslint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

module.exports = () => {
  /** @type {import('webpack').Configuration} */
  const devConfig = {
    mode: 'development',

    target: 'web',

    devtool: 'inline-source-map',
    // devServer: {
    //   contentBase: path.join(__dirname, 'dist'),
    // },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.(wasm)$/,
          type: 'javascript/auto',
          loader: 'file-loader',
          options: {
            publicPath: 'dist/',
          },
        },
      ],
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js',
      chunkFilename: 'main-library.js',
    },

    plugins: [
      new ESLintPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new webpack.HotModuleReplacementPlugin(),
      // new webpack.EvalSourceMapDevToolPlugin({}),
      new webpack.DefinePlugin({
        'process.env': '{}',
        PRODUCTION: JSON.stringify(false),
        VERSION: JSON.stringify('3.0.0'), // TODO Update from package.json
      }),
    ],
  };

  return devConfig;
};
