import Socket from '../../classes/SocketClass';
import { CustomFunction } from '../data/dataFunctions';
import { AbstractType } from '../datatypes/abstractType';
import { ArrayType } from '../datatypes/arrayType';
import { StringType } from '../datatypes/stringType';

class ExcelHelper extends CustomFunction {
  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return false;
  }
}

export class Table_GetColumnByName extends ExcelHelper {
  public getName(): string {
    return 'Get table column by name';
  }

  public getDescription(): string {
    return 'Returns the column data of a specified column';
  }

  public getTags(): string[] {
    return ['Array'].concat(super.getTags());
  }

  protected getDefaultFunction(): string {
    return `(ArrayOfArraysIn, ColumnName) => {
  const index = ArrayOfArraysIn[0].findIndex(col => col == ColumnName);
  if (index > -1) {
    return ArrayOfArraysIn.map(row => row[index]).slice(1);
  }
  return [];
}`;
  }
  protected getDefaultParameterValues(): Record<string, any> {
    return { ColumnName: 'ExampleColumn' };
  }
  protected getDefaultParameterTypes(): Record<string, any> {
    return { ArrayOfArraysIn: new ArrayType(), ColumnName: new StringType() };
  }
  protected getOutputParameterType(): AbstractType {
    return new ArrayType();
  }
}
