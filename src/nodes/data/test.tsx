/* eslint-disable @typescript-eslint/no-this-alias */
import React from 'react';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  DEFAULT_EDITOR_DATA,
  DEFAULT_IMAGE,
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
const NumberFloatName = 'Number (float)';
const NumberNameInt = 'Number (int)';
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
const NumberFloatOutName = 'Number-Float-Out';
const NumberIntOutName = 'Number-Int-Out';
const StringOutName = 'String-Out';

const OutputName = 'Output';
const OutputTypeName = 'Type';

const TESTDATA = {
  ARRAY: [
    'Edith Carlmar',
    'Shirin Neshat',
    'Olga Preobrazhenskaya',
    'Alice Guy-Blaché',
    'Lois Weber',
  ],
  BOOLEAN: false,
  CODE: DEFAULT_EDITOR_DATA,
  COLOR: TRgba.fromString(NODE_TYPE_COLOR.OUTPUT),
  ENUM: [
    {
      text: 'text',
      value: 'value',
    },
  ],
  FUNCTION: () => console.log('TESTDATA.FUNCTION: This is a function call.'),
  HTML: <div>I am a div</div>,
  IMAGE: DEFAULT_IMAGE,
  JSON: {
    id: 'e651be1f-8c78-4a7e-bd7c-5d9a4c6f1a81',
    created: '2023-11-18T12:00:00Z',
    isActive: true,
    picture: 'https://example.com/profile_picture.jpg',
    age: 28,
    eyeColor: 'blue',
    name: 'Cornelius Quillfeather',
    email: 'cornelius@example.com',
    favoriteAnimals: ['Elephant', 'Penguin', 'Dragon'],
    favoriteFruit: 'Kiwi',
    canCountTo: NaN,
    past: null,
    future: undefined,
    friends: [
      {
        id: '1a9fe1b0-64e6-4f45-ae8c-0e56ffec83fb',
        name: 'Penelope Pumpernickel',
      },
      {
        id: '3c46aeba-f07e-4cc4-8480-d4fe235a1d5f',
        name: 'Bartholomew Bumblesnatch',
      },
      {
        id: 'bfd3f801-75de-4e22-9883-23ef3f77a6f3',
        name: 'Prudence Plumthorn',
      },
    ],
  },
  NAN: NaN,
  NULL: null,
  NUMBER_FLOAT: 3.14159265359,
  NUMBER_INT: 42,
  STRING:
    'In the midst of winter, I found there was, within me, an invincible summer',
  STRING_MULTILINE: `In Whimsyshire, where dreams take flight,
Lived Prudence Plumthorn, a wondrous sight.
With emerald eyes and tales so bright,
Her stories spun magic in the night.

In a cottage small, her quill took flight,
Weaving adventures with sheer delight.
Spirits from woods, drawn by her lore,
Gathered 'round her, seeking more.

Her tales became whispers, in moon's soft glow,
Across the land, they'd freely flow.
From hills to valleys, hearts took flight,
Thanks to Prudence and her stories of light.`,
  UNDEFINED: undefined,
};

export class TestDataProvider extends PPNode {
  keys = Object.keys(TESTDATA);
  index = 0;

  public getName(): string {
    return 'Test data provider';
  }

  public getDescription(): string {
    return 'Provides a range of test data';
  }

  public getTags(): string[] {
    return ['Playground'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.OUT, OutputName, new AnyType()),
      new Socket(SOCKET_TYPE.OUT, OutputTypeName, new StringType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const testDataType = this.keys[this.index % this.keys.length];
    const data = TESTDATA[testDataType];
    outputObject[OutputTypeName] = testDataType;
    outputObject[OutputName] = data;
    this.index++;
    // setTimeout(() => {
    //   this.executeOptimizedChain();
    // }, 500);
  }
}

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
      new Socket(SOCKET_TYPE.IN, ArrayName, new ArrayType(), TESTDATA.ARRAY),
      new Socket(
        SOCKET_TYPE.IN,
        BooleanName,
        new BooleanType(),
        TESTDATA.BOOLEAN,
      ),
      new Socket(SOCKET_TYPE.IN, CodeName, new CodeType(), DEFAULT_EDITOR_DATA),
      new Socket(SOCKET_TYPE.IN, ColorName, new ColorType(), TESTDATA.COLOR),
      new Socket(SOCKET_TYPE.IN, DeferredPixiTypeName, new DeferredPixiType()),
      new Socket(SOCKET_TYPE.IN, EnumName, new EnumType(TESTDATA.ENUM), ''),
      new Socket(SOCKET_TYPE.IN, FileName, new FileType()),
      new Socket(SOCKET_TYPE.IN, FunctionName, new FunctionType()),
      new Socket(SOCKET_TYPE.IN, ImageName, new ImageType(), TESTDATA.IMAGE),
      new Socket(SOCKET_TYPE.IN, JSONTypeName, new JSONType(), TESTDATA.JSON),
      new Socket(
        SOCKET_TYPE.IN,
        NumberFloatName,
        new NumberType(),
        TESTDATA.NUMBER_FLOAT,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        NumberNameInt,
        new NumberType(),
        TESTDATA.NUMBER_INT,
      ),
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
      new Socket(SOCKET_TYPE.OUT, NumberFloatOutName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, NumberIntOutName, new NumberType()),
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
    outputObject[NumberFloatOutName] = inputObject[NumberFloatName];
    outputObject[NumberIntOutName] = inputObject[NumberNameInt];
    outputObject[StringOutName] = inputObject[StringName];
    // outputObject[TriggerOutName] = inputObject[TriggerName];
  }
}
