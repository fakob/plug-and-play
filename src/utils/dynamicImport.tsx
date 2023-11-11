import React from 'react';
import PPNode from '../classes/NodeClass';
import InterfaceController from '../InterfaceController';

export async function dynamicImport(
  node: PPNode,
  packageName: string,
): Promise<any> {
  InterfaceController.showSnackBar(
    <span>
      Installing <b>{packageName}</b> ...
    </span>,
    {
      key: packageName,
    },
  );
  console.time(`${packageName} imported`);
  const url = 'https://esm.sh/' + packageName;
  const toReturn = await import(/* webpackIgnore: true */ url);
  console.timeEnd(`${packageName} imported`);
  InterfaceController.hideSnackBar(packageName);
  InterfaceController.showSnackBar(
    <span>
      <b>{packageName}</b> was installed
    </span>,
  );
  return toReturn;
}
