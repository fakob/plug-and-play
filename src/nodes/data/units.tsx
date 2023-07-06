import { CustomFunction } from './dataFunctions';

export class ConvertUnits extends CustomFunction {
  // these are imported before node is added to the graph
  public getDynamicImports(): string[] {
    return ['convert-units'];
  }
  public getName(): string {
    return 'Convert Units';
  }

  public getDescription(): string {
    return 'converts all found units in an object to common base';
  }
  protected getDefaultFunction(): string {
    return '(ObjectIn) => {\n\
      \n\
  }';
  }
}
