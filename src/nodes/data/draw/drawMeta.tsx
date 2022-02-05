import * as PIXI from 'pixi.js';
import PPGraph from '../../../classes/GraphClass';
import PPNode from '../../../classes/NodeClass';
import { CustomArgs } from '../../../utils/interfaces';
import { NODE_TYPE_COLOR } from '../../../utils/constants';
import { CodeType } from '../../datatypes/codeType';
import { NumberType } from '../../datatypes/numberType';
import { PixiType } from '../../datatypes/pixiType';
import { BooleanType } from '../../datatypes/booleanType';
import { ArrayType } from '../../datatypes/arrayType';

export class PIXIMultiplier extends PPNode {
  _inputContainerRef: PIXI.Container;
  _containerRef: PIXI.Container;
  createAndAddClone: (
    type: string,
    x: number,
    y: number,
    parentContainer: PIXI.Container,
    objectToClone: PIXI.Graphics | PIXI.Text,
    index: number,
    adjustArray?: any,
    testString?: string
  ) => PIXI.Graphics;
  createSubcontainerAndIterateOverChildren: (
    x: number,
    y: number,
    container: PIXI.Container,
    objectToClone: PIXI.Container,
    index: number,
    adjustArray?: any,
    testString?: string
  ) => PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DRAW,
    });

    this.addOutput('container', new PixiType());
    this.addInput('input', new PixiType());
    this.addInput('count', new NumberType(true, 0), 9, undefined);
    this.addInput('column', new NumberType(true, 0), 3, undefined);
    this.addInput('distance', new NumberType(), 10.0);
    this.addInput('scale', new NumberType(), 1.0);
    this.addInput('adjustArray', new ArrayType());

    this.name = 'GraphicsMultiplier';
    this.description = 'Multiplies the input graphics';

    this.onNodeAdded = () => {
      const inputContainer = new PIXI.Container();
      const container = new PIXI.Container();
      this._containerRef = (
        this.graph.viewport.getChildByName('backgroundCanvas') as PIXI.Container
      ).addChild(container);
      this._inputContainerRef = this._containerRef.addChild(inputContainer);
      this.setOutputData('container', this._containerRef);
      this._containerRef.name = this.id;
    };

    this.onExecute = async function (input) {
      let inputRef: PIXI.DisplayObject[] | PIXI.DisplayObject = input['input'];
      const count = input['count'];
      const column = input['column'];
      const distance = input['distance'];
      const scale = input['scale'];
      const adjustArray = input['adjustArray'];
      this._containerRef.removeChildren();
      this._inputContainerRef.removeChildren();
      // console.log(adjustArray);

      // if inputRef is array, wrap it into container
      if (inputRef && inputRef.constructor.name === 'Array') {
        this._inputContainerRef.addChild(...(inputRef as PIXI.DisplayObject[]));
        inputRef = this._inputContainerRef;
      }

      if (inputRef != undefined) {
        let x = 0;
        let y = 0;

        // if output is not connected, then draw it next to the node
        if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
          this._containerRef.x = 0;
          this._containerRef.y = 0;
          // this._containerRef.visible = false;
        } else {
          x = this.x + this.width;
          y = this.y;
          // this._containerRef.visible = true;
        }

        for (let indexCount = 0; indexCount < count; indexCount++) {
          let objectToPosition;
          if (inputRef.constructor.name === 'Container') {
            objectToPosition = this.createSubcontainerAndIterateOverChildren(
              x,
              y,
              this._containerRef,
              inputRef as PIXI.Container,
              indexCount,
              adjustArray?.[indexCount]?.container,
              `[${indexCount}].container`
            );
          } else {
            objectToPosition = this.createAndAddClone(
              inputRef.constructor.name,
              x,
              y,
              this._containerRef,
              inputRef as PIXI.Graphics,
              indexCount,
              adjustArray?.[indexCount],
              `[${indexCount}]`
            );
          }

          objectToPosition.x =
            x + (objectToPosition.width + distance) * (indexCount % column);
          objectToPosition.y =
            y +
            (objectToPosition.height + distance) *
              Math.floor(indexCount / column);
        }

        this._containerRef.scale.set(scale);
      }
    };

    this.onNodeRemoved = (): void => {
      (
        this.graph.viewport.getChildByName('backgroundCanvas') as PIXI.Graphics
      ).removeChild(this._containerRef);
    };

    this.createAndAddClone = (
      type: string,
      x: number,
      y: number,
      container: PIXI.Container,
      objectToClone: PIXI.Graphics | PIXI.Text,
      index: number,
      adjustArray?: any,
      testString?: string
    ): PIXI.Graphics => {
      let clone;
      switch (type) {
        case 'Graphics':
          clone = (objectToClone as PIXI.Graphics).clone();
          break;
        case 'Text':
          clone = new PIXI.Text(
            (objectToClone as PIXI.Text).text,
            (objectToClone as PIXI.Text).style
          );
          break;

        default:
          break;
      }
      console.log(adjustArray, clone, type);
      clone.name =
        container === this._containerRef
          ? `${this.id}-${index}`
          : `${container.name}-${index}`;
      clone.x = 0;
      clone.y = 0;
      if (adjustArray?.height !== undefined) {
        clone.height = adjustArray.height;
      }
      if (adjustArray?.width !== undefined) {
        clone.width = adjustArray.width;
      }
      if (adjustArray?.scale !== undefined) {
        clone.scale.x = adjustArray.scale;
      }
      return container.addChild(clone);
    };

    this.createSubcontainerAndIterateOverChildren = (
      x: number,
      y: number,
      container: PIXI.Container,
      objectToClone: PIXI.Container,
      index: number,
      adjustArray?: any,
      testString?: string
    ): PIXI.Container => {
      // console.log(adjustArray);
      const children = objectToClone.children;
      const subContainer = container.addChild(new PIXI.Container());
      subContainer.name =
        container === this._containerRef
          ? `${this.id}-subContainer-${index}`
          : `${subContainer.name}-subContainer-${index}`;
      for (
        let indexChildren = 0;
        indexChildren < children.length;
        indexChildren++
      ) {
        const element = children[indexChildren];
        if (element.constructor.name === 'Container') {
          this.createSubcontainerAndIterateOverChildren(
            x,
            y,
            subContainer,
            element as PIXI.Container,
            indexChildren,
            adjustArray?.[indexChildren]?.container,
            `${testString}[${indexChildren}].container`
          );
        } else if (element.constructor.name === 'Text') {
          this.createAndAddClone(
            'Text',
            x,
            y,
            subContainer,
            element as PIXI.Text,
            indexChildren,
            adjustArray?.[indexChildren],
            `${testString}[${indexChildren}]`
          );
        } else {
          this.createAndAddClone(
            'Graphics',
            x,
            y,
            subContainer,
            element as PIXI.Graphics,
            indexChildren,
            adjustArray?.[indexChildren],
            `${testString}[${indexChildren}]`
          );
        }
      }
      subContainer.x = 0;
      subContainer.y = 0;
      return container.addChild(subContainer);
    };
  }
}

export class PIXIContainer extends PPNode {
  _containerRef: PIXI.Container[];
  canvas: PIXI.Container;
  executeOnClick: (index: number) => void;
  onClickHandler: (event?: PIXI.InteractionEvent) => void;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const customOnClickFunction = `(e) => {
  console.log("Clicked node:", this);
  console.log("Clicked index:", e.currentTarget.index);
  this.executeOnClick(e.currentTarget.index);
}`;

    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DRAW,
    });

    this.addOutput('container', new PixiType());
    this.addOutput('clickedTargetIndex', new NumberType());
    this.addOutput('clickedTargetArray', new ArrayType());

    // when true, group inputs and duplicate these containers
    // use this mode for custom click events
    // when false, all inputs are duplicated within one container
    this.addInput('mode', new BooleanType(), false, false);

    this.addInput('x', new NumberType(), 0, false);
    this.addInput('y', new NumberType(), 0, false);
    this.addInput('angle', new NumberType(true, -360, 360), 0, false);
    this.addInput('scale', new NumberType(), 1.0, false);
    this.addInput('onClick', new CodeType(), customOnClickFunction, false);
    this.addInput('input1', new PixiType());
    this.addInput('input2', new PixiType());
    this.addInput('input3', new PixiType());

    this.name = 'Container';
    this.description = 'General-purpose display object that holds children';

    this.onNodeAdded = () => {
      this.canvas = this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      const container = new PIXI.Container();
      this._containerRef = [this.canvas.addChild(container)];
      this._containerRef[0].name = `${this.id}-${0}`;
      this.onClickHandler = eval(customOnClickFunction);
      this._containerRef[0].on('pointerdown', this.onClickHandler);

      this.setOutputData('container', this._containerRef);
    };

    this.onExecute = async function (input) {
      const mode = input['mode'];
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const angle = [].concat(input['angle']);
      const scale = [].concat(input['scale']);
      const onClick = input['onClick'];
      const input1 = [].concat(input['input1']);
      const input2 = [].concat(input['input2']);
      const input3 = [].concat(input['input3']);

      if (mode) {
        const lengthOfLargestArray = Math.max(
          0,
          x.length,
          y.length,
          angle.length,
          scale.length,
          input1.length,
          input2.length,
          input3.length
        );

        if (lengthOfLargestArray !== this._containerRef.length) {
          for (let index = 0; index < this._containerRef.length; index++) {
            this._containerRef[index].destroy();
          }
          this._containerRef.splice(0, this._containerRef.length); // clear array without removing reference
        }

        for (let index = 0; index < lengthOfLargestArray; index++) {
          if (!this._containerRef[index]) {
            const container = new PIXI.Container();
            this._containerRef[index] = this.canvas.addChild(container);
            this.onClickHandler = eval(onClick);
            (this._containerRef[index] as PIXI.Container).on(
              'pointerdown',
              this.onClickHandler
            );
          } else {
            this._containerRef[index].removeChildren();
          }
          this._containerRef[index].name = `${this.id}-${index}`;

          const myX = +(x[index] ?? x[x.length - 1]);
          const myY = +(y[index] ?? y[y.length - 1]);
          const myAngle = +(angle[index] ?? angle[angle.length - 1]);
          const myInput1 = input1[index] ?? input1[input1.length - 1];
          const myInput2 = input2[index] ?? input2[input2.length - 1];
          const myInput3 = input3[index] ?? input3[input3.length - 1];

          myInput1 == undefined
            ? undefined
            : this._containerRef[index].addChild(myInput1);
          myInput2 == undefined
            ? undefined
            : this._containerRef[index].addChild(myInput2);
          myInput3 == undefined
            ? undefined
            : this._containerRef[index].addChild(myInput3);

          // if output is not connected, then draw it next to the node
          if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
            this._containerRef[index].x = myX;
            this._containerRef[index].y = myY;
          } else {
            this._containerRef[index].x = this.x + this.width + myX;
            this._containerRef[index].y = this.y + myY;
          }
          this._containerRef[index].index = index;
          this._containerRef[index].angle = myAngle;
          this._containerRef[index].buttonMode = true;
          this._containerRef[index].interactive = true;
          this._containerRef[index].scale.set(scale);
        }
      } else {
        for (let index = 0; index < this._containerRef.length; index++) {
          this._containerRef[index].destroy();
        }
        this._containerRef.splice(0, this._containerRef.length); // clear array without removing reference
        const container = new PIXI.Container();
        this._containerRef[0] = this.canvas.addChild(container);
        this._containerRef[0].name = `${this.id}`;

        const allInputs = [...input1, ...input2, ...input3];

        for (let index = 0; index < allInputs.length; index++) {
          if (allInputs[index]) {
            const allInputsRef = this._containerRef[0].addChild(
              allInputs[index]
            );
            this.onClickHandler = eval(onClick);
            (allInputsRef as PIXI.Container).on(
              'pointerdown',
              this.onClickHandler
            );
            allInputsRef.index = index;
            allInputsRef.buttonMode = true;
            allInputsRef.interactive = true;
          }
        }

        // if output is not connected, then draw it next to the node
        if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
          this._containerRef[0].x = +x[0];
          this._containerRef[0].y = +y[0];
        } else {
          this._containerRef[0].x = this.x + this.width + x[0];
          this._containerRef[0].y = this.y + y[0];
        }
        this._containerRef[0].angle = angle;
        this._containerRef[0].scale.set(scale);
      }
    };

    this.executeOnClick = (index: number): void => {
      this._containerRef[index].alpha =
        this._containerRef[index].alpha === 0.3 ? 1 : 0.3;
      this.setOutputData('clickedTargetIndex', index);
      const clickedTargetArray = this._containerRef.map((item) => {
        return item.alpha === 0.3;
      });
      this.setOutputData('clickedTargetArray', clickedTargetArray);
      this.executeOptimizedChain();
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._containerRef.length; index++) {
        this.canvas.removeChild(this._containerRef[index]);
      }
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}
