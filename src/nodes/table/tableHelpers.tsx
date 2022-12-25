import PPGraph from "../../classes/GraphClass";
import PPNode from "../../classes/NodeClass";
import Socket from "../../classes/SocketClass";
import { SOCKET_TYPE } from "../../utils/constants";
import { CustomFunction } from "../data/dataFunctions";
import { AbstractType } from "../datatypes/abstractType";
import { ArrayType } from "../datatypes/arrayType";
import { CodeType } from "../datatypes/codeType";
import { NumberType } from "../datatypes/numberType";
import { StringType } from "../datatypes/stringType";


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
        return 'Get column data by column name';
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

export class Table_GetRowObjects extends ExcelHelper {

    public getName(): string {
        return 'Get table row objects';
    }
    public getDescription(): string {
        return 'Get table row objects from table in range';
    }
    protected getDefaultFunction(): string {
        return `(ArrayOfArraysIn, StartRow, EndRow) => {
            const sliced = ArrayOfArraysIn.slice(StartRow, EndRow);
            const categories = ArrayOfArraysIn[0];
            const objects = [];
            for (let i = 1; i < sliced.length; i++){
              const newObject = {};
              for (let j = 0; j < categories.length; j++){
                if (sliced[i][j] !== ""){
                  newObject[categories[j]] = sliced[i][j];
                }
              }
              newObject["RowIndex"] = i;
              if (Object.keys(newObject).length > 1){
                objects.push(newObject);
              }
          
            }
            return objects;
          }`;
    }
    protected getDefaultParameterValues(): Record<string, any> {
        return {
            StartRow: 0,
            EndRow: 100000,
        };
    }
    protected getDefaultParameterTypes(): Record<string, any> {
        return {
            ArrayOfArraysIn: new ArrayType(),
            StartRow: new NumberType(true),
            EndRow: new NumberType(true),
        };
    }
    protected getOutputParameterType(): AbstractType {
        return new ArrayType();
    }
}

export class ObjectFilter extends PPNode {
    public getName(): string {
        return "Object Filter";
    }
    public getDescription(): string {
        return "Streamlined filter for use with object arrays";
    }
    protected getDefaultIO(): Socket[] {
        return [new Socket(SOCKET_TYPE.IN, "ObjectArray", new ArrayType()), new Socket(SOCKET_TYPE.OUT, "ObjectArray", new ArrayType())];
    }

    protected async onExecute(input, output): Promise<void> {
        const filterNames: string[] = Object.keys(input).filter(key => key != "ObjectArray");
        const objects = input["ObjectArray"];
        output["ObjectArray"] = objects.filter(object => {
            return !filterNames.find(f => !eval(input[f])(object));
        }
        );
    }

    public getAdditionalRightClickOptions() {
        const inputArray = this.getInputData("ObjectArray");
        const toReturn = {};
        if (inputArray.length && inputArray[0]) {
            const categories = Object.keys(inputArray[0]);
            categories.forEach(category => {
                // give unique name for socket
                let current = 1;
                const name = "Filter " + category;
                let total = name;
                while (this.inputSocketArray.find(socket => socket.name == total)) {
                    total = name + " " + ++current;
                }

                // add template
                toReturn[name] = () => {
                    this.addInput(total, new CodeType(), "(a => a[\"" + category + "\"].includes(\"\"))");
                    PPGraph.currentGraph.selection.selectNodes([], true, true);
                    PPGraph.currentGraph.selection.selectNodes([this], false, true);
                }
            });
        }
        return toReturn;

    }

}

