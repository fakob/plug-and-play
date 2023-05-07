import { CustomFunction } from '../data/dataFunctions';

abstract class BooleanOperationNode extends CustomFunction {
  // doesn't really have anything special now, but feels like it makes sense
  public getTags(): string[] {
    return ['Logic'].concat(super.getTags());
  }
}

export class NOT extends BooleanOperationNode {
  public getName(): string {
    return 'NOT';
  }

  public getDescription(): string {
    return 'Returns the inverse of the input';
  }

  protected getDefaultFunction(): string {
    return '(a) => {\n\treturn !a;\n}';
  }
}

export class OR extends BooleanOperationNode {
  public getName(): string {
    return 'OR';
  }

  public getDescription(): string {
    return 'Returns true if any of the inputs are truthy';
  }

  protected getDefaultFunction(): string {
    return '(a,b) => {\n\treturn a || b ? true : false;\n}';
  }
}

export class AND extends BooleanOperationNode {
  public getName(): string {
    return 'AND';
  }

  public getDescription(): string {
    return 'Returns true if all of the inputs are truthy';
  }

  protected getDefaultFunction(): string {
    return '(a,b) => {\n\treturn a && b ? true : false;\n}';
  }
}
