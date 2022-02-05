import * as PIXI from 'pixi.js';
import React from 'react';
import {
  IRegion,
  Table as BPTable,
  Column as BPColumn,
  Cell as BPCell,
} from '@blueprintjs/table';
import * as csvParser from 'papaparse';
import PPGraph from '../../../classes/GraphClass';
import PPNode from '../../../classes/NodeClass';
import { CustomArgs } from '../../../utils/interfaces';
import {
  COLOR,
  COLOR_DARK,
  NODE_TYPE_COLOR,
  NOTE_LINEHEIGHT_FACTOR,
  PIXI_PIVOT_OPTIONS,
  PIXI_TEXT_ALIGN_OPTIONS,
} from '../../../utils/constants';
import { hexToTRgba, trgbaToColor } from '../../../pixi/utils-pixi';
import { AnyType } from '../../datatypes/anyType';
import { CodeType } from '../../datatypes/codeType';
import { NumberType } from '../../datatypes/numberType';
import { EnumType } from '../../datatypes/enumType';
import { ColorType } from '../../datatypes/colorType';
import { PixiType } from '../../datatypes/pixiType';
import { BooleanType } from '../../datatypes/booleanType';
import { StringType } from '../../datatypes/stringType';
import { ArrayType } from '../../datatypes/arrayType';
import { TriggerType } from '../../datatypes/triggerType';

export class PIXIText extends PPNode {
  _ref: PIXI.Text[];
  textStyle: PIXI.TextStyle;
  canvas: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const fillColor = COLOR_DARK;

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('text', new StringType(), 'Text');
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('width', new NumberType(), 100);
    this.addInput('angle', new NumberType(true, -360, 360), 0);
    this.addInput('align', new EnumType(PIXI_TEXT_ALIGN_OPTIONS), 0, false);
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 0, false);
    this.addInput('size', new NumberType(true, 1), 24, undefined);
    this.addInput('color', new ColorType(), hexToTRgba(fillColor));

    this.name = 'Draw text';
    this.description = 'Draws a text';

    this.onNodeAdded = () => {
      this.textStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: this.getInputData('size'),
        lineHeight: this.getInputData('size') * NOTE_LINEHEIGHT_FACTOR,
        align: this.getInputData('align'),
        whiteSpace: 'pre-line',
        wordWrap: true,
        wordWrapWidth: this.getInputData('width'),
        lineJoin: 'round',
      });

      this.canvas = this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      const basicText = new PIXI.Text(
        this.getInputData('text'),
        this.textStyle
      );

      this._ref = [this.canvas.addChild(basicText)];
      this.setOutputData('graphics', this._ref);
    };

    this.onExecute = async function (input) {
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const width = [].concat(input['width']);
      const angle = [].concat(input['angle']);
      const text = [].concat(input['text']);
      const size = [].concat(input['size']);
      const color = [].concat(input['color']);
      const align = input['align'];
      const pivot = input['pivot'];
      const lengthOfLargestArray = Math.max(
        0,
        x.length,
        y.length,
        width.length,
        angle.length,
        text.length,
        size.length,
        color.length
      );

      for (let index = 0; index < this._ref.length; index++) {
        this._ref[index].destroy();
      }
      this._ref.splice(0, this._ref.length); // clear array without removing reference

      for (let index = 0; index < lengthOfLargestArray; index++) {
        // if output is not connected, then draw it next to the node
        const myX = +(x[index] ?? x[x.length - 1]);
        const myY = +(y[index] ?? y[y.length - 1]);
        const myWidth = +(width[index] ?? width[width.length - 1]);
        const myAngle = +(angle[index] ?? angle[angle.length - 1]);
        const mySize = +(size[index] ?? size[size.length - 1]);
        const myText = text[index] ?? text[text.length - 1];
        const myColor = trgbaToColor(color[index] ?? color[color.length - 1]);
        const PIXIText = new PIXI.Text(myText, {
          ...this.textStyle,
          fontSize: mySize,
          lineHeight: mySize * NOTE_LINEHEIGHT_FACTOR,
          fill: PIXI.utils.string2hex(myColor.hex()),
          wordWrapWidth: myWidth,
          align: align,
        });
        this._ref[index] = this.canvas.addChild(PIXIText);
        this._ref[index].name = `${this.id}-${index}`;

        const pivotPoint =
          PIXI_PIVOT_OPTIONS.find((item) => item.text === pivot)?.value ??
          PIXI_PIVOT_OPTIONS[0].value; // use first entry if not found

        // set pivot point and rotate
        (this._ref[index] as PIXI.Text).pivot.x =
          pivotPoint.x * this._ref[index].width;
        (this._ref[index] as PIXI.Text).pivot.y =
          pivotPoint.y * this._ref[index].height;
        (this._ref[index] as PIXI.Text).angle = myAngle;

        if ((this as PPNode).getOutputSocketByName('graphics')?.hasLink()) {
          this._ref[index].x = myX;
          this._ref[index].y = myY;
        } else {
          this._ref[index].x = this.x + this.width + myX;
          this._ref[index].y = this.y + myY;
        }
      }
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._ref.length; index++) {
        this.canvas.removeChild(this._ref[index]);
      }
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class PIXIRect extends PPNode {
  _ref: PIXI.Graphics[];
  canvas: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const rectWidth = 100;
    const rectHeight = 100;
    const fillColor = COLOR[1];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('angle', new NumberType(true, -360, 360), 0);
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 0, false);
    this.addInput(
      'width',
      new NumberType(),
      customArgs?.width ?? rectWidth,
      false
    );
    this.addInput(
      'height',
      new NumberType(),
      customArgs?.height ?? rectHeight,
      false
    );
    this.addInput('color', new ColorType(), hexToTRgba(fillColor));

    this.name = 'Draw rectangle';
    this.description = 'Draws a rectangle';

    this.onNodeAdded = () => {
      this.canvas = this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      const graphics = new PIXI.Graphics();
      this._ref = [this.canvas.addChild(graphics)];

      this.setOutputData('graphics', this._ref);
    };

    this.onExecute = async function (input) {
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const angle = [].concat(input['angle']);
      const width = [].concat(input['width']);
      const height = [].concat(input['height']);
      const color = [].concat(input['color']);
      const pivot = input['pivot'];
      const lengthOfLargestArray = Math.max(
        0,
        x.length,
        y.length,
        angle.length,
        width.length,
        height.length,
        color.length
      );

      if (lengthOfLargestArray !== this._ref.length) {
        for (let index = 0; index < this._ref.length; index++) {
          this._ref[index].destroy();
        }
        this._ref.splice(0, this._ref.length); // clear array without removing reference
      }
      for (let index = 0; index < lengthOfLargestArray; index++) {
        if (!this._ref[index]) {
          const graphics = new PIXI.Graphics();
          this._ref[index] = this.canvas.addChild(graphics);
        } else {
          this._ref[index].clear();
        }
        this._ref[index].name = `${this.id}-${index}`;

        // if output is not connected, then draw it next to the node
        const myX = +(x[index] ?? x[x.length - 1]);
        const myY = +(y[index] ?? y[y.length - 1]);
        const myAngle = +(angle[index] ?? angle[angle.length - 1]);
        const myWidth = +(width[index] ?? width[width.length - 1]);
        const myHeight = +(height[index] ?? height[height.length - 1]);
        const myColor = trgbaToColor(color[index] ?? color[color.length - 1]);

        this._ref[index].beginFill(
          PIXI.utils.string2hex(myColor.hex()),
          myColor.alpha()
        );
        const pivotPoint =
          PIXI_PIVOT_OPTIONS.find((item) => item.text === pivot)?.value ??
          PIXI_PIVOT_OPTIONS[0].value; // use first entry if not found

        // set pivot point and rotate
        (this._ref[index] as PIXI.Graphics).pivot.x = pivotPoint.x * myWidth;
        (this._ref[index] as PIXI.Graphics).pivot.y = pivotPoint.y * myHeight;
        (this._ref[index] as PIXI.Graphics).angle = myAngle;

        if ((this as PPNode).getOutputSocketByName('graphics')?.hasLink()) {
          this._ref[index].drawRect(myX, myY, myWidth, myHeight);
        } else {
          this._ref[index].drawRect(
            this.x + this.width + myX,
            this.y + myY,
            myWidth,
            myHeight
          );
        }
        this._ref[index].endFill();
      }
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._ref.length; index++) {
        this.canvas.removeChild(this._ref[index]);
      }
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class PIXICircle extends PPNode {
  _ref: PIXI.Graphics[];
  canvas: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const radius = 50;
    const fillColor = COLOR[8];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 0, false);
    this.addInput(
      'radius',
      new NumberType(),
      customArgs?.radius ?? radius,
      false
    );
    this.addInput('color', new ColorType(), hexToTRgba(fillColor));

    this.name = 'Draw circle';
    this.description = 'Draws a circle';

    this.onNodeAdded = () => {
      this.canvas = this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      const graphics = new PIXI.Graphics();
      this._ref = [this.canvas.addChild(graphics)];
      this.setOutputData('graphics', this._ref);
    };

    this.onExecute = async function (input) {
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const radius = [].concat(input['radius']);
      const color = [].concat(input['color']);
      const pivot = input['pivot'];
      const lengthOfLargestArray = Math.max(
        0,
        x.length,
        y.length,
        radius.length,
        color.length
      );

      if (lengthOfLargestArray !== this._ref.length) {
        for (let index = 0; index < this._ref.length; index++) {
          this._ref[index].destroy();
        }
        this._ref.splice(0, this._ref.length); // clear array without removing reference
      }
      for (let index = 0; index < lengthOfLargestArray; index++) {
        if (!this._ref[index]) {
          const graphics = new PIXI.Graphics();
          this._ref[index] = this.canvas.addChild(graphics);
        } else {
          this._ref[index].clear();
        }
        this._ref[index].name = `${this.id}-${index}`;

        // if output is not connected, then draw it next to the node
        const myX = +(x[index] ?? x[x.length - 1]);
        const myY = +(y[index] ?? y[y.length - 1]);
        const myRadius = +(radius[index] ?? radius[radius.length - 1]);
        const myColor = trgbaToColor(color[index] ?? color[color.length - 1]);

        this._ref[index].beginFill(
          PIXI.utils.string2hex(myColor.hex()),
          myColor.alpha()
        );
        const pivotPoint =
          PIXI_PIVOT_OPTIONS.find((item) => item.text === pivot)?.value ??
          PIXI_PIVOT_OPTIONS[0].value; // use first entry if not found

        // set pivot point
        (this._ref[index] as PIXI.Graphics).pivot.x =
          pivotPoint.x * myRadius * 2;
        (this._ref[index] as PIXI.Graphics).pivot.y =
          pivotPoint.y * myRadius * 2;
        if ((this as PPNode).getOutputSocketByName('graphics')?.hasLink()) {
          this._ref[index].drawCircle(myX + myRadius, myY + myRadius, myRadius);
        } else {
          this._ref[index].drawCircle(
            this.x + this.width + myX + myRadius,
            this.y + myY + myRadius,
            myRadius
          );
        }
        this._ref[index].endFill();
      }
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._ref.length; index++) {
        this.canvas.removeChild(this._ref[index]);
      }
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class Table extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  parsedData: any;
  update: () => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const isHybrid = true;

    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.TRANSFORM,
      nodeWidth,
      nodeHeight,
      minNodeWidth: nodeWidth / 2,
      minNodeHeight: nodeHeight / 2,
      isHybrid,
    });

    this.addOutput('selectedData', new StringType());
    this.addInput('reload', new TriggerType());
    this.addInput('data', new StringType(), customArgs?.data ?? '');

    this.name = 'Table';
    this.description = 'Adds a table';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('data') ?? '';
      this.parsedData = this.parseData(data);
      this.createContainerComponent(document, TableParent, {
        dataArray: this.parsedData,
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();
    };

    // when the Node is loaded, update the react component
    this.update = (): void => {
      const data = this.getInputData('data') ?? '';
      this.parsedData = this.parseData(data);
      this.renderReactComponent(TableParent, {
        dataArray: this.parsedData,
      });
      this.setOutputData('selectedData', this.parsedData);
    };

    const getCellRenderer = (key: number) => {
      return (row: number) => <BPCell>{`${this.parsedData[row][key]}`}</BPCell>;
    };

    const onSelection = (selectedRegions: IRegion[]): void => {
      const selectedData = selectedRegions.map((region) => {
        const regionData = [];
        const rowIndexStart = region.rows === undefined ? 0 : region.rows[0];
        const rowIndexEnd =
          region.rows === undefined
            ? this.parsedData.length - 1
            : region.rows[1];
        for (
          let rowIndex = rowIndexStart;
          rowIndex <= rowIndexEnd;
          rowIndex++
        ) {
          const rowData = [];
          const colIndexStart = region.cols === undefined ? 0 : region.cols[0];
          const colIndexEnd =
            region.cols === undefined
              ? this.parsedData[rowIndex].length - 1
              : region.cols[1];
          for (
            let colIndex = colIndexStart;
            colIndex <= colIndexEnd;
            colIndex++
          ) {
            rowData.push(this.parsedData[rowIndex][colIndex]);
          }
          regionData.push(rowData);
        }
        return regionData;
      });
      if (selectedRegions.length === 1) {
        this.setOutputData('selectedData', selectedData[0]);
      } else {
        this.setOutputData('selectedData', selectedData);
      }
      this.executeOptimizedChain();
    };

    // small presentational component
    const TableParent = (props) => {
      return props.dataArray.length > 0 ? (
        <BPTable numRows={props.dataArray.length} onSelection={onSelection}>
          {props.dataArray[0].map((col, index) => {
            return (
              <BPColumn name={col} cellRenderer={getCellRenderer(index)} />
            );
          })}
        </BPTable>
      ) : (
        <BPTable numRows={20}>
          <BPColumn />
          <BPColumn />
          <BPColumn />
        </BPTable>
      );
    };
  }

  parseData(data: string): any {
    const results = csvParser.parse(data, {});
    console.log(results);
    return results?.data;
  }

  trigger(): void {
    this.update();
  }
}
