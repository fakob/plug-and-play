import * as PIXI from 'pixi.js';
import React, { useEffect, useState } from 'react';

import NodeClass from '../../classes/NodeClass';
import GraphClass from '../../classes/GraphClass';
import PureNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { StringType } from '../datatypes/stringType';
import { CodeType } from '../datatypes/codeType';
import { NumberType } from '../datatypes/numberType';
import { CustomArgs } from '../../utils/interfaces';
import { JSONType } from '../datatypes/jsonType';
import { COLOR_WHITE, NODE_TYPE_COLOR } from '../../utils/constants';
import { JsonPathPicker } from '../../components/JsonPathPicker';

const filterCodeName = 'Filter';
const arrayName = 'Array';
const outElementName = 'Element';
const arrayOutName = 'FilteredArray';
const forStartIndexName = 'StartIndex';
const forEndIndexName = 'EndIndex';
const incrementName = 'Increment';
const forOutIndexName = 'Index';

const mapCodeName = 'Function';
const mapOutName = 'OutArray';

const anyCodeName = 'Code';
const inDataName = 'InData';
const outDataName = 'OutData';

const constantInName = 'In';
const constantOutName = 'Out';

export class JSONPicker extends NodeClass {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  parsedData: any;
  update: () => void;

  constructor(name: string, graph: GraphClass, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const isHybrid = true;

    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.TRANSFORM,
      nodeWidth,
      nodeHeight,
      isHybrid,
    });

    this.addInput('json', new JSONType(), customArgs?.data ?? '');
    this.addOutput('path', new StringType(), customArgs?.data ?? '');
    this.addOutput('value', new JSONType(), customArgs?.data ?? '');

    this.name = 'JSONPicker';
    this.description = 'Pick a part of the JSON';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const jsonString = this.getInputData('json') ?? '';
      this.createContainerComponent(
        document,
        ReactParent,
        {
          json: jsonString,
        },
        { backgroundColor: COLOR_WHITE }
      );
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();
    };

    // when the Node is loaded, update the react component
    this.update = (): void => {
      const jsonString = this.getInputData('json') ?? '';
      console.log('update:', jsonString);
      this.renderReactComponent(ReactParent, {
        json: jsonString,
      });
    };

    this.onExecute = async (input, output) => {
      this.update();
    };

    // small presentational component
    const ReactParent = (props) => {
      const [json, setJson] = useState<string | undefined>(props.json || '""');
      const [path, setPath] = useState('');

      console.log(json);

      const getData = function (json, path) {
        const tokens = path.substring(1, path.length - 1).split('][');

        console.log(tokens);
        let val =
          json[tokens[0].replace(/^"(.+(?="$))"$/, '$1').replace('"', '"')];
        console.log(val, tokens);
        if (tokens.length < 2) return val;
        for (let i = 1; i < tokens.length; i++) {
          val =
            val[tokens[i].replace(/^"(.+(?="$))"$/, '$1').replace('"', '"')];
        }
        return val;
      };

      useEffect(() => {
        console.log(json);
        setJson(props.json);
        this.setOutputData('path', path);
        console.log(json, path, getData(json, path));
        this.setOutputData('value', getData(json, path));
        this.execute(new Set());
      }, [props.json, path]);

      const onChoosePath = (path: string) => {
        console.log(path);
        setPath(path);
      };

      return <JsonPathPicker json={json} onChoose={onChoosePath} path={path} />;
    };
  }
}

export class Code extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inDataName, new AnyType(), 'bruh'),
      new Socket(
        SOCKET_TYPE.IN,
        anyCodeName,
        new CodeType(),
        '// in here you are provided with two objects; "inputObject" and "outputObject", they each have named parameters based on the input and output sockets, so by default there will be an inputObject["' +
          inDataName +
          '"] and an outputObject["' +
          outDataName +
          '"]\n\noutputObject["' +
          outDataName +
          '"] = inputObject["' +
          inDataName +
          '"]'
      ),
      new Socket(SOCKET_TYPE.OUT, outDataName, new ArrayType()),
    ];
  }
  public getCanAddInput(): boolean {
    return true;
  }
  public getCanAddOutput(): boolean {
    return true;
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    eval(inputObject?.[anyCodeName]);
  }
}

export class Filter extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(SOCKET_TYPE.IN, filterCodeName, new CodeType(), '(a) => true'),
      new Socket(SOCKET_TYPE.OUT, arrayOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const filterCode = inputObject[filterCodeName];
    const inputArray = inputObject[arrayName];
    outputObject[arrayOutName] = inputArray?.filter(eval(filterCode));
  }
}

export class Map extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(SOCKET_TYPE.IN, mapCodeName, new CodeType(), '(a) => a'),
      new Socket(SOCKET_TYPE.OUT, mapOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const mapCode = inputObject[mapCodeName];
    const inputArray = inputObject[arrayName];
    outputObject[mapOutName] = inputArray?.map(eval(mapCode));
  }
}

export class Constant extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, constantInName, new AnyType(), 0),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new AnyType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[constantOutName] = inputObject?.[constantInName];
  }
}

export class Uniques extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(SOCKET_TYPE.OUT, arrayOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputArray = inputObject?.[arrayName];
    outputObject[arrayOutName] = [...new Set(inputArray)];
  }
}

// the purpose of for loops in our context is for actions that have sideeffects outside of plug and playground, if you are not looking for external side effects you are likely not looking for a loop
export class ForLoop extends NodeClass {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, forStartIndexName, new NumberType(true), 0),
      new Socket(SOCKET_TYPE.IN, forEndIndexName, new NumberType(true), 1),
      new Socket(SOCKET_TYPE.IN, incrementName, new NumberType(true, 1), 1),
      new Socket(SOCKET_TYPE.OUT, forOutIndexName, new NumberType(true), 0),
    ];
  }

  currentIndex = 0;

  protected getMinIndex(inputObject: unknown): number {
    return inputObject[forStartIndexName];
  }

  protected getMaxIndex(inputObject: unknown): number {
    return inputObject[forEndIndexName];
  }

  protected getIncrement(inputObject: unknown): number {
    return inputObject[incrementName];
  }

  // we actually override the base execute function here as we are modifying the flow
  public async execute(): Promise<void> {
    const inputObject = this.remapInput(this.inputSocketArray);
    for (
      this.currentIndex = this.getMinIndex(inputObject);
      this.currentIndex < this.getMaxIndex(inputObject);
      this.currentIndex += this.getIncrement(inputObject)
    ) {
      await this.rawExecute();

      /*for (const outputSocket of this.outputSocketArray) {
        await outputSocket.notifyChange(new Set());
      }*/
    }
    // comment here is just gonna show the last output but eh
    this.drawComment();
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[forOutIndexName] = this.currentIndex;
  }
}

export class ConsolePrint extends NodeClass {
  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, constantInName, new ArrayType(), 0)];
  }

  protected async onExecute(inputObject: any): Promise<void> {
    console.log(inputObject?.[constantInName]);
  }
}

export class ForEachLoop extends ForLoop {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), 0),
      new Socket(SOCKET_TYPE.OUT, outElementName, new AnyType(), 0),
    ];
  }
  protected getMinIndex(inputObject: unknown): number {
    return 0;
  }

  protected getMaxIndex(inputObject: unknown): number {
    return inputObject[arrayName].length;
  }

  protected getIncrement(inputObject: unknown): number {
    return 1;
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[outElementName] =
      inputObject?.[arrayName]?.[this.currentIndex];
  }
}

// TODO implement
// Not quite sure how we want this one to look... CodeType? or based on input?
//export class WhileLoop extends NodeClass {}
