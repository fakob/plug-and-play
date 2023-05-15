import { CustomFunction } from '../data/dataFunctions';

abstract class BooleanOperationNode extends CustomFunction {
  // doesn't really have anything special now, but feels like it makes sense
}

export class NOT extends BooleanOperationNode {
  protected getDefaultFunction(): string {
    return '(a) => {\n\treturn !a;\n}';
  }
}

export class OR extends BooleanOperationNode {
  protected getDefaultFunction(): string {
    return '(a,b) => {\n\treturn a || b ? true : false;\n}';
  }
}

export class AND extends BooleanOperationNode {
  protected getDefaultFunction(): string {
    return '(a,b) => {\n\treturn a && b ? true : false;\n}';
  }
}
