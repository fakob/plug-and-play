import { NodeExecutionWarning } from '../../classes/ErrorClass';
import { TParseType, TRgba } from '../../utils/interfaces';
import { ArrayType } from './arrayType';

// this one forces data to arrive in the form of an array of objects with specific properties

export interface GraphInputPoint {
  Value: number;
  Name: string | undefined;
  Color: TRgba | undefined;
}

export class GraphInputType extends ArrayType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Graph Input';
  }

  getColor(): TRgba {
    return new TRgba(154, 183, 255);
  }

  private static parseEntryIntoGraphInputPoint(arrayEntry: any) {
    let valueToUse = NaN;
    let nameToUse = undefined;
    let colorToUse = undefined;
    if (typeof arrayEntry === 'number') {
      // someone feeding in an array of numbers, lets make that into array of Values with nothing else
      return { Value: arrayEntry, Name: '', Color: undefined };
    } else if (typeof arrayEntry == 'object') {
      if ('Value' in arrayEntry) {
        // seems this is properly structured in regard to value already, nice
        if (typeof arrayEntry === 'string') {
          valueToUse = parseFloat(arrayEntry);
        } else {
          valueToUse = arrayEntry['Value'];
        }
      } else {
        // its an object, but no entries named "Value", try to find a number
        const firstNumber = Object.values(arrayEntry).find(
          (entry) => typeof entry == 'number',
        );
        if (firstNumber !== undefined) {
          valueToUse = firstNumber as number;
        } else {
          // continue trying to parse some string into our elusive value
          Object.values(arrayEntry).forEach((entry) => {
            if (typeof entry == 'string') {
              const attemptParsed = parseFloat(entry);
              if (!Number.isNaN(attemptParsed)) {
                valueToUse = attemptParsed;
              }
            }
          });
        }
      }
      if ('Name' in arrayEntry) {
        nameToUse = arrayEntry['Name'];
      } else {
        // see if any other field here can be of use
        nameToUse =
          Object.values(arrayEntry).find(
            (entry) => typeof entry === 'string',
          ) || '';
      }
      colorToUse = arrayEntry['Color'];
    } else if (typeof arrayEntry == 'string') {
      return { Value: parseFloat(arrayEntry), Name: '', Color: undefined };
    }
    return { Value: valueToUse, Name: nameToUse, Color: colorToUse };
  }

  parse(data: any): TParseType {
    let parsedData;
    const warnings: NodeExecutionWarning[] = [];

    // lets hope its an array, if not then we will have to turn something into an array
    let dataArray: GraphInputPoint[] = data;
    if (typeof data === 'object') {
      let foundConversion = false;
      const values = Object.values(data);
      // its an object, lets see if there is an array in here that contains numbers or objects
      values.forEach((potentialArray) => {
        if (Array.isArray(potentialArray) && potentialArray.length > 0) {
          // found an array, lets see what the elements inside look like
          const testSample = potentialArray[0];
          if (
            typeof testSample === 'number' ||
            (typeof testSample === 'string' &&
              !Number.isNaN(parseFloat(testSample)))
          ) {
            dataArray = potentialArray;
            foundConversion = true;
          }
        }
      });
      if (!foundConversion && values.length > 0) {
        // otherwise... maybe this is already a key-pair structure, name:value
        if (
          typeof values[0] === 'number' ||
          (typeof values[0] == 'string' && !Number.isNaN(parseFloat(values[0])))
        ) {
          const names = Object.keys(data);
          dataArray = [];
          for (let i = 0; i < names.length; i++) {
            let parsedValue: number = 0; // Default value

            if (typeof values[i] === 'number') {
              parsedValue = values[i] as number; // type assertion here
            } else {
              // Attempt to parse as a number only if it's not already a number
              const potentialNumber = parseFloat(values[i].toString());
              if (!isNaN(potentialNumber)) {
                parsedValue = potentialNumber;
              } else {
                // Handle the case where the value is not a number
                // You could assign a default value or throw an error
                parsedValue = 0; // Example: using 0 as a default
              }
            }

            dataArray.push({
              Name: names[i],
              Value: parsedValue,
              Color: undefined,
            });
          }
          foundConversion = true;
        }
      }
    }
    if (Array.isArray(dataArray)) {
      // check out all the array entries to see if they are any good
      const parsedArray: GraphInputPoint[] = dataArray
        .map(GraphInputType.parseEntryIntoGraphInputPoint)
        .filter((entry) => !Number.isNaN(entry.Value));
      parsedData = parsedArray;
    } else {
      parsedData = [];
      warnings.push(
        new NodeExecutionWarning(
          'No data could be graph input data found. [] is returned',
        ),
      );
    }

    return {
      value: parsedData,
      warnings: warnings,
    };
  }

  recommendedInputNodeWidgets(): string[] {
    return ['GRAPH_LINE', 'GRAPH_PIE'];
  }
}
