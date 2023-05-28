/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = (env, argv) => {
  return require(`./webpack.config.${env}.ts`);
};
