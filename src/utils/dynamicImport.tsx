import PPNode from '../classes/NodeClass';

export async function dynamicImport(
  node: PPNode,
  packageName: string
): Promise<any> {
  console.time(`${packageName} imported`);
  const url = 'https://esm.sh/' + packageName;
  const toReturn = await import(/* webpackIgnore: true */ url);
  console.timeEnd(`${packageName} imported`);
  return toReturn;
}
