/* eslint-disable @typescript-eslint/no-this-alias */
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  DEFAULT_EDITOR_DATA,
  DEFAULT_IMAGE,
  GESTUREMODE,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
} from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { BooleanType } from '../datatypes/booleanType';
import { CodeType } from '../datatypes/codeType';
import { ColorType } from '../datatypes/colorType';
import { DeferredPixiType } from '../datatypes/deferredPixiType';
import { EnumType } from '../datatypes/enumType';
import { FileType } from '../datatypes/fileType';
import { FunctionType } from '../datatypes/functionType';
import { ImageType } from '../datatypes/imageType';
import { JSONType } from '../datatypes/jsonType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';
import { TriggerType } from '../datatypes/triggerType';

const AnyName = 'Any';
const ArrayName = 'Array';
const BooleanName = 'Boolean';
const CodeName = 'Code';
const ColorName = 'Color';
const DeferredPixiTypeName = 'DeferredPixiType';
const EnumName = 'Enum';
const FileName = 'File';
const FunctionName = 'Function';
const ImageName = 'Image';
const JSONTypeName = 'JSONType';
const NumberName = 'Number';
const StringName = 'String';
const TriggerName = 'Trigger';

const AnyOutName = 'Any-Out';
const ArrayOutName = 'Array-Out';
const BooleanOutName = 'Boolean-Out';
const CodeOutName = 'Code-Out';
const ColorOutName = 'Color-Out';
const DeferredDeferredPixiTypeOutName = 'DeferredPixiType-Out';
const FunctionOutName = 'Function-Out';
const ImageOutName = 'Image-Out';
const JSONTypeOutName = 'JSONType-Out';
const NumberOutName = 'Number-Out';
const StringOutName = 'String-Out';

export class TestDataTypes extends PPNode {
  initialData: any;

  public getName(): string {
    return 'Test data types';
  }

  public getDescription(): string {
    return 'Adds a test node which lists all available socket data types';
  }

  public getTags(): string[] {
    return ['Playground'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  getPreferredNodesPerSocket(): Map<string, string[]> {
    return new Map([
      [BooleanName, ['Break', 'Constant']],
      [ArrayOutName, ['Constant', 'Break']],
    ]);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, AnyName, new AnyType()),
      new Socket(SOCKET_TYPE.IN, ArrayName, new ArrayType(), [
        'Edith Carlmar',
        'Shirin Neshat',
        'Olga Preobrazhenskaya',
        'Alice Guy-Blaché',
        'Lois Weber',
      ]),
      new Socket(SOCKET_TYPE.IN, BooleanName, new BooleanType(), true),
      new Socket(SOCKET_TYPE.IN, CodeName, new CodeType(), DEFAULT_EDITOR_DATA),
      new Socket(SOCKET_TYPE.IN, ColorName, new ColorType()),
      new Socket(SOCKET_TYPE.IN, DeferredPixiTypeName, new DeferredPixiType()),
      new Socket(
        SOCKET_TYPE.IN,
        EnumName,
        new EnumType([
          {
            text: 'text',
            value: 'value',
          },
        ]),
      ),
      new Socket(SOCKET_TYPE.IN, FileName, new FileType()),
      new Socket(SOCKET_TYPE.IN, FunctionName, new FunctionType()),
      new Socket(SOCKET_TYPE.IN, ImageName, new ImageType(), DEFAULT_IMAGE),
      new Socket(SOCKET_TYPE.IN, JSONTypeName, new JSONType(), GESTUREMODE),
      new Socket(SOCKET_TYPE.IN, NumberName, new NumberType(), 42),
      new Socket(
        SOCKET_TYPE.IN,
        StringName,
        new StringType(),
        'In the midst of winter, I found there was, within me, an invincible summer',
      ),
      new Socket(SOCKET_TYPE.IN, TriggerName, new TriggerType()),

      new Socket(SOCKET_TYPE.OUT, AnyOutName, new AnyType()),
      new Socket(SOCKET_TYPE.OUT, ArrayOutName, new ArrayType()),
      new Socket(SOCKET_TYPE.OUT, BooleanOutName, new BooleanType()),
      new Socket(SOCKET_TYPE.OUT, CodeOutName, new CodeType()),
      new Socket(SOCKET_TYPE.OUT, ColorOutName, new ColorType()),
      new Socket(
        SOCKET_TYPE.OUT,
        DeferredDeferredPixiTypeOutName,
        new DeferredPixiType(),
      ),
      //   new Socket(SOCKET_TYPE.OUT, DynamicOutName, new DynamicEnumType()),
      //   new Socket(SOCKET_TYPE.OUT, EnumOutName, new EnumType()),
      new Socket(SOCKET_TYPE.OUT, FunctionOutName, new FunctionType()),
      new Socket(SOCKET_TYPE.OUT, ImageOutName, new ImageType()),
      new Socket(SOCKET_TYPE.OUT, JSONTypeOutName, new JSONType()),
      new Socket(SOCKET_TYPE.OUT, NumberOutName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, StringOutName, new StringType()),
      //   new Socket(SOCKET_TYPE.OUT, TriggerOutName, new TriggerType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    outputObject[AnyOutName] = inputObject[AnyName];
    outputObject[ArrayOutName] = inputObject[ArrayName];
    outputObject[BooleanOutName] = inputObject[BooleanName];
    outputObject[CodeOutName] = inputObject[CodeName];
    outputObject[ColorOutName] = inputObject[ColorName];
    outputObject[DeferredDeferredPixiTypeOutName] =
      inputObject[DeferredPixiTypeName];
    // outputObject[DynamicOutName] = inputObject[DynamicName];
    // outputObject[EnumOutName] = inputObject[EnumName];
    outputObject[FunctionOutName] = inputObject[FunctionName];
    outputObject[ImageOutName] = inputObject[ImageName];
    outputObject[JSONTypeOutName] = inputObject[JSONTypeName];
    outputObject[NumberOutName] = inputObject[NumberName];
    outputObject[StringOutName] = inputObject[StringName];
    // outputObject[TriggerOutName] = inputObject[TriggerName];
  }
}
