import * as PIXI from 'pixi.js';
import React from 'react';
import Color from 'color';
import {
  IRegion,
  Table as BPTable,
  Column as BPColumn,
  Cell as BPCell,
} from '@blueprintjs/table';
import * as csvParser from 'papaparse';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs, SerializedNode } from '../utils/interfaces';
import textFit from '../pixi/textFit';
import {
  DATATYPE,
  NODE_TYPE_COLOR,
  NODE_OUTLINE_DISTANCE,
  NODE_WIDTH,
  NOTE_FONTSIZE,
  NOTE_LINEHEIGHT_FACTOR,
  NOTE_MARGIN_STRING,
  NOTE_PADDING,
  NOTE_TEXTURE,
  SOCKET_WIDTH,
} from '../utils/constants';

export class Circle extends PPNode {
  _circleRef: PIXI.Graphics;

  // uses customArgs?.color as defaultColor
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const radius = 50;
    const rectColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('rectangle', DATATYPE.PIXI);
    this.addInput('x', DATATYPE.NUMBER, 0);
    this.addInput('y', DATATYPE.NUMBER, 0);
    this.addInput(
      'radius',
      DATATYPE.NUMBER,
      customArgs?.radius ?? radius,
      false
    );

    this.addInput('color', DATATYPE.COLOR, Color(rectColor).array());

    this.name = 'Draw circle';
    this.description = 'Draws a circle';

    const rect = new PIXI.Graphics();
    this._circleRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Graphics).addChild(rect);
    this._circleRef.beginFill(PIXI.utils.string2hex(Color(rectColor).hex()), 1);
    this._circleRef.drawCircle(
      this.x + this.width + radius,
      this.y + radius,
      radius
    );
    this._circleRef.endFill();

    this.onExecute = function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const radius = input['radius'];
      const color = Color.rgb(input['color'] as number[]);

      this._circleRef.clear();
      this._circleRef.beginFill(
        PIXI.utils.string2hex(color.hex()),
        color.alpha()
      );

      // if output is not connected, then draw it next to the node
      if (!(this as PPNode).getOutputSocketByName('rectangle').hasLink()) {
        this._circleRef.drawCircle(
          this.x + this.width + radius + x,
          this.y + radius + y,
          radius
        );
      } else {
        this._circleRef.drawCircle(x + radius, y + radius, radius);
      }
      this._circleRef.endFill();
      output['rectangle'] = this._circleRef;
    };
  }
}

export class Rect extends PPNode {
  _rectRef: PIXI.Graphics;

  // uses customArgs?.color as defaultColor
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const rectWidth = 100;
    const rectHeight = 100;
    const rectColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('rectangle', DATATYPE.PIXI);
    this.addInput('x', DATATYPE.NUMBER, 0);
    this.addInput('y', DATATYPE.NUMBER, 0);
    this.addInput(
      'width',
      DATATYPE.NUMBER,
      customArgs?.width ?? rectWidth,
      false
    );
    this.addInput(
      'height',
      DATATYPE.NUMBER,
      customArgs?.height ?? rectHeight,
      false
    );
    this.addInput('color', DATATYPE.COLOR, Color(rectColor).array());

    this.name = 'Draw rectangle';
    this.description = 'Draws a rectangle';

    const rect = new PIXI.Graphics();
    this._rectRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Graphics).addChild(rect);
    this._rectRef.beginFill(PIXI.utils.string2hex(Color(rectColor).hex()), 1);
    this._rectRef.drawRect(this.x + this.width, this.y, rectWidth, rectHeight);
    this._rectRef.endFill();

    this.onExecute = function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const width = input['width'];
      const height = input['height'];
      const color = Color.rgb(input['color'] as number[]);

      this._rectRef.clear();
      this._rectRef.beginFill(
        PIXI.utils.string2hex(color.hex()),
        color.alpha()
      );

      // if output is not connected, then draw it next to the node
      if (!(this as PPNode).getOutputSocketByName('rectangle').hasLink()) {
        this._rectRef.drawRect(
          this.x + this.width + x,
          this.y + y,
          width,
          height
        );
      } else {
        this._rectRef.drawRect(x, y, width, height);
      }
      this._rectRef.endFill();
      output['rectangle'] = this._rectRef;
    };
  }
}

export class Container extends PPNode {
  _containerRef: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DRAW,
    });

    this.addOutput('container', DATATYPE.PIXI);
    this.addInput('x', DATATYPE.NUMBER);
    this.addInput('y', DATATYPE.NUMBER);
    this.addInput('scale', DATATYPE.NUMBER, 1.0);
    this.addInput('input1', DATATYPE.PIXI);
    this.addInput('input2', DATATYPE.PIXI);
    this.addInput('input3', DATATYPE.PIXI);

    this.name = 'Container';
    this.description = 'General-purpose display object that holds children';

    const container = new PIXI.Container();
    this._containerRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container).addChild(container);

    this.onExecute = function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const scale = input['scale'];
      const input1 = input['input1'];
      const input2 = input['input2'];
      const input3 = input['input3'];
      // console.log(input1, input2, input3);
      // console.log(this._containerRef);
      this._containerRef.removeChildren;

      input1 == undefined ? undefined : this._containerRef.addChild(input1);
      input2 == undefined ? undefined : this._containerRef.addChild(input2);
      input3 == undefined ? undefined : this._containerRef.addChild(input3);

      // if output is not connected, then draw it next to the node
      if (!(this as PPNode).getOutputSocketByName('container').hasLink()) {
        this._containerRef.x = this.x + this.width + x;
        this._containerRef.y = this.y + y;
      } else {
        this._containerRef.x = x;
        this._containerRef.y = y;
      }
      this._containerRef.scale.set(scale);
      output['container'] = this._containerRef;
    };
  }
}

export class Image extends PPNode {
  _imageRef: PIXI.Sprite;
  _texture: PIXI.Texture;
  _loader: PIXI.Loader;
  adjustImageAndNodeSize: (baseTexture: PIXI.BaseTexture) => void;

  // uses customArgs?.objectURL as texture
  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const isHybrid = true;

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      isHybrid,
    });

    // this.addOutput('image', DATATYPE.PIXI);
    this.addOutput('width', DATATYPE.NUMBER);
    this.addOutput('height', DATATYPE.NUMBER);
    // this.addInput('reload', DATATYPE.TRIGGER);
    this.addInput('base64', DATATYPE.STRING, customArgs?.base64, false);
    console.log(customArgs);
    console.log(customArgs.base64);
    console.log(typeof customArgs.base64);

    this.name = 'Image';
    this.description = 'Adds an image';

    // when texture is loaded get width and height
    // and set proper aspect ratio
    this.adjustImageAndNodeSize = (baseTexture) => {
      console.log('textureLoaded');

      // get width and height
      const { width, height } = baseTexture;

      // calculate drawing width and height
      const aspectRatio = width / height;
      let newNodeWidth = nodeWidth;
      let newNodeHeight = nodeHeight;
      if (aspectRatio > 1) {
        newNodeHeight = newNodeHeight / aspectRatio;
      } else {
        newNodeWidth = newNodeWidth * aspectRatio;
      }
      console.log(newNodeWidth, newNodeHeight);

      // set imageRef and node to new size
      this._imageRef.x = SOCKET_WIDTH / 2;
      this._imageRef.y = NODE_OUTLINE_DISTANCE;
      this._imageRef.width = newNodeWidth;
      this._imageRef.height = newNodeHeight;
      this.resizeNode(newNodeWidth, newNodeHeight);

      // output width and height of image
      this.setOutputData('width', width);
      this.setOutputData('height', height);
    };

    this._loader = new PIXI.Loader(); // PixiJS exposes a premade instance for you to use.
    this._loader.onComplete.add((loader, resources) => {
      console.log(loader, resources);
      const sprite = PIXI.Sprite.from(resources[this.id].texture);
      (this._imageRef as any) = (this as PIXI.Container).addChild(sprite);
      console.log(
        resources[this.id].texture.height,
        resources[this.id].texture.width
      );
      console.log(sprite.height, sprite.width);
      this.adjustImageAndNodeSize(resources[this.id].texture.baseTexture);
    });

    this.onNodeAdded = () => {
      const base64 = this.getInputData('base64');
      if (this._loader.resources[this.id] === undefined && base64 !== '') {
        this._loader.add(this.id, base64);
        this._loader.load();
      }
    };

    // when the Node is loaded, load the base64 image and adjust the size
    this.onConfigure = (): void => {
      if (this._loader.resources[this.id] === undefined) {
        const base64 = this.getInputData('base64');
        if (base64 !== undefined) {
          this._loader.add(this.id, base64);
          this._loader.load();
        }
      } else {
        const sprite = PIXI.Sprite.from(
          this._loader.resources[this.id]?.texture
        );
        (this._imageRef as any) = (this as PIXI.Container).addChild(sprite);
        this.adjustImageAndNodeSize(
          this._loader.resources[this.id].texture.baseTexture
        );
      }
    };
  }

  // trigger(): void {
  //   const url: string = this.getInputData('url');
  //   // if url is set then get image
  //   if (url !== '') {
  //     // const objectURL = URL.createObjectURL(url);
  //     const newTexture = PIXI.Texture.from(url);
  //     this._imageRef.texture = newTexture;
  //     this._imageRefClone.texture = newTexture;
  //   }
  //   const { width, height } = this._imageRef.texture.orig;
  //   this.setOutputData('image', this._imageRefClone);
  //   this.setOutputData('width', width);
  //   this.setOutputData('height', height);
  // }
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
      isHybrid,
    });

    this.addOutput('selectedData', DATATYPE.STRING);
    this.addInput('reload', DATATYPE.TRIGGER);
    this.addInput('data', DATATYPE.STRING, customArgs?.data ?? '');

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
      this.setOutputData('selectedData', selectedData);
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

type AdditionalProps = {
  backgroundColor?: string;
  width?: number;
  height?: number;
  focus?: boolean;
};

export class Label extends PPNode {
  update: (additionalProps?: AdditionalProps) => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 300;
    const nodeHeight = 62;
    const isHybrid = true;
    const defaultColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      isHybrid,
      color: defaultColor,
      colorTransparency: 1.0,
    });

    this.addOutput('data', DATATYPE.STRING, undefined, false);
    this.addInput('data', DATATYPE.STRING, customArgs?.data ?? '', false);
    this.addInput(
      'backgroundColor',
      DATATYPE.COLOR,
      Color(defaultColor).array(),
      false
    );
    this.addInput(
      'width',
      DATATYPE.NUMBER,
      customArgs?.width ?? nodeWidth,
      false
    );
    this.addInput(
      'height',
      DATATYPE.NUMBER,
      customArgs?.height ?? nodeHeight,
      false
    );

    this.name = 'Label';
    this.description = 'Adds text';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('data') ?? '';
      this.createContainerComponent(document, Parent, {
        data,
        focus: true,
      });
      // reset width and height
      this.container.style.width = 'auto';
      this.container.style.height = 'auto';
    };

    // when the stored data is read, resize the node and update the react component
    this.onConfigure = (): void => {
      const color = Color.rgb(this.getInputData('backgroundColor') as number[]);
      // console.log(input['color']);
      this.color = PIXI.utils.string2hex(color.hex());
      this.colorTransparency = color.alpha();
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.resizeNode(width, height);

      this.update({ width, height });
    };

    // update the react component
    this.update = (additionalProps?: AdditionalProps): void => {
      const data = this.getInputData('data');
      this.renderReactComponent(Parent, {
        ...baseProps,
        ...additionalProps,
        data,
      });
      this.setOutputData('data', data);
    };

    this.onNodeSelected = () => {
      console.log('onNodeSelected:', this.id);
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.update({ width, height });
    };

    this.onNodeDoubleClick = () => {
      console.log('onNodeDoubleClick:', this.id);
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.update({ width, height, focus: true });
    };

    this.onExecute = (input, output) => {
      if (!this.doubleClicked) {
        const data = input['data'];
        const color = Color.rgb(input['backgroundColor'] as number[]);
        // console.log(input['color']);
        this.color = PIXI.utils.string2hex(color.hex());
        this.colorTransparency = color.alpha();
        this.setOutputData('data', data);

        this.update();
      }
    };

    const baseProps = {
      update: this.update.bind(this),
      resizeNode: this.resizeNode.bind(this),
      setInputData: this.setInputData.bind(this),
      setOutputData: this.setOutputData.bind(this),
    };

    // const style = {
    //   display: 'flex',
    //   // alignItems: 'center',
    //   // justifyContent: 'center',
    //   border: 'solid 1px #ddd',
    //   background: '#f0f0f0',
    // } as const;
  }
}

type Props = {
  update(): void;
  resizeNode(width: number, height: number): void;
  setInputData(name: string, data: any): void;
  setOutputData(name: string, data: any): void;
  id: string;
  selected: boolean;
  doubleClicked: boolean;
  focus?: boolean;

  width: number;
  height: number;
  data: any;
};

const Parent: React.FunctionComponent<Props> = (props) => {
  const [width, setWidth] = React.useState(props.width);
  const [height, setHeight] = React.useState(props.height);
  const [value, setValue] = React.useState(props.data);

  // run on any props change after initial creation
  useEffect(() => {
    // change only if it was set
    if (props.width) {
      setWidth(props.width);
    }
    if (props.height) {
      setHeight(props.height);
    }
  }, [props.width, props.height]);

  useEffect(() => {
    setValue(props.data);
  }, [props.data]);

  useEffect(() => {
    // save value
    if (!props.selected && props.setInputData !== undefined) {
      onConfirm(value);
    }
  }, [props.selected]);

  const onConfirm = (value) => {
    setValue(value);
    props.setInputData('data', value);
    props.update();
  };

  return (
    <Resizable
      enable={{
        right: true,
        bottom: false,
        bottomRight: false,
        top: false,
        left: false,
        topRight: false,
        topLeft: false,
        bottomLeft: false,
      }}
      className={styles.resizeElementLabel}
      handleClasses={{
        right: styles.resizeHandle,
        // bottomRight: styles.resizeHandle,
        // bottom: styles.resizeHandle,
      }}
      style={{
        borderStyle: 'dashed',
        borderWidth: props.doubleClicked ? '0 1px 0 0' : '0',
        borderColor: 'rgba(225, 84, 125, 1)',
      }}
      size={{ width, height }}
      onResize={(e, direction, ref, d) => {
        const width = ref.offsetWidth;
        const height = ref.offsetHeight;
        setWidth(width);
        setHeight(height);
        props.resizeNode(width, height);
      }}
      onResizeStop={(e, direction, ref, d) => {
        const width = ref.offsetWidth;
        const height = ref.offsetHeight;
        props.setInputData('width', width);
        props.setInputData('height', height);
        console.log('onResizeStop: ', props.width, props.height);
      }}
    >
      <H1>
        <EditableText
          placeholder="Write away..."
          onChange={(value) => setValue(value)}
          onConfirm={onConfirm}
          isEditing={props.focus || props.doubleClicked}
          defaultValue={props.data}
          key={props.data} // hack so defaultValue get's set
          selectAllOnFocus={true}
          // multiline={true}
        />
      </H1>
    </Resizable>
  );
};
