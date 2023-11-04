import { TRgba } from '../../utils/interfaces';
import { AbstractType } from './abstractType';
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
    return new TRgba(148, 48, 196);
  }

  private static parseEntryIntoGraphInputPoint(arrayEntry: any) {
    let valueToUse = undefined;
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
          valueToUse = firstNumber;
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
      nameToUse = arrayEntry['Name'];
      colorToUse = arrayEntry['Color'];
    } else if (typeof arrayEntry == 'string') {
      return { Value: parseFloat(arrayEntry), Name: '', Color: undefined };
    }
    return { Value: valueToUse, Name: nameToUse, Color: colorToUse };
  }

  parse(data: any): any {
    // lets hope its an array, if not then we will have to turn something into an array
    let dataArray: any = data;
    if (typeof data === 'object') {
      // its an object, lets see if there is an array in here that contains numbers or objects
      Object.values(data).forEach((potentialArray) => {
        if (Array.isArray(potentialArray) && potentialArray.length > 0) {
          // promising
          const testSample = potentialArray[0];
          if (
            typeof testSample === 'number' ||
            (typeof testSample === 'string' &&
              !Number.isNaN(parseFloat(testSample)))
          ) {
            dataArray = potentialArray;
          }
        }
      });
    }
    if (Array.isArray(dataArray)) {
      // check out all the array entries to see if they are any good
      const parsedArray: GraphInputPoint[] = dataArray.map(
        GraphInputType.parseEntryIntoGraphInputPoint,
      );
      return parsedArray;
    } else {
      return [];
    }
  }

  recommendedInputNodeWidgets(): string[] {
    return ['GRAPH_LINE', 'GRAPH_PIE'];
  }
}
