import { CustomFunction } from '../data/dataFunctions';

abstract class BooleanOperationNode extends CustomFunction {
  // doesn't really have anything special now, but feels like it makes sense
  public getKeywords(): string[] {
    return ['Logic'].concat(super.getKeywords());
  }
}

export class NOT extends BooleanOperationNode {
  protected getDefaultFunction(): string {
    return '(a) => {\n\treturn !a;\n}';
  }

  public getName(): string {
    return 'NOT';
  }
  public getDescription(): string {
    return 'Logical NOT operation, returns inverse of input truthiness';
  }
}

export class OR extends BooleanOperationNode {
  protected getDefaultFunction(): string {
    return '(a,b) => {\n\treturn a || b ? true : false;\n}';
  }

  public getName(): string {
    return 'OR';
  }
  public getDescription(): string {
    return 'Logical OR operation, returns true if any of the inputs are truthy';
  }
}

export class AND extends BooleanOperationNode {
  protected getDefaultFunction(): string {
    return '(a,b) => {\n\treturn a && b ? true : false;\n}';
  }
  public getName(): string {
    return 'AND';
  }
  public getDescription(): string {
    return 'Logical AND operation, returns true if all of the inputs are truthy';
  }
}
