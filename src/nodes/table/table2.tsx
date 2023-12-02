import PPGraph from '../../classes/GraphClass';
import HybridNode2 from '../../classes/HybridNode2';
import * as PIXI from 'pixi.js';
import * as XLSX from 'xlsx';
import { TNodeSource } from '../../utils/interfaces';

const inputSocketName = 'Input';
const arrayOfArraysSocketName = 'Array of arrays';
const rowObjectsNames = 'Array of objects';
const workBookInputSocketName = 'Initial data';
const sheetIndexInputSocketName = 'Sheet index';

export class Table2 extends HybridNode2 {
  workBook: XLSX.WorkBook;
  public getName(): string {
    return 'Table 2';
  }

  public getDescription(): string {
    return 'Adds a table. To import a spreadsheets, just drag the file onto the playground';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getPreferredInputSocketName(): string {
    return inputSocketName;
  }

  getXLSXModule(): typeof XLSX {
    return PPGraph.currentGraph.dynamicImports['xlsx'];
  }

  public onNodeAdded = async (source?: TNodeSource): Promise<void> => {
    return;
  };
  protected getParentComponent(inputObject: any) {
    return;
  }
}
