import * as PIXI from 'pixi.js';
import { NodeData } from './interfaces';
import {
  NODE_BACKGROUNDCOLOR,
  NODE_CORNERRADIUS,
  NODE_MARGIN_TOP,
  NODE_MARGIN_BOTTOM,
  NODE_OUTLINE_DISTANCE,
  NODE_HEADER_HEIGHT,
  NODE_HEADER_TEXTMARGIN_LEFT,
  NODE_HEADER_TEXTMARGIN_TOP,
  NODE_TEXTSTYLE,
  NODE_WIDTH,
  INPUTSOCKET_HEIGHT,
  INPUTSOCKET_WIDTH,
  OUTPUTSOCKET_HEIGHT,
} from './constants';
import PPGraph from './GraphClass';
import InputSocket from './InputSocketClass';
import OutputSocket from './OutputSocketClass';

const nodeBackgroundColorHex = PIXI.utils.string2hex(NODE_BACKGROUNDCOLOR);

export default class PPNode extends PIXI.Container {
  graph: PPGraph;
  _NodeNameRef: PIXI.Text;
  _BackgroundRef: PIXI.Graphics;
  _selected: boolean;
  dragging: boolean;
  relativeClickPosition: PIXI.Point | null;
  clickPosition: PIXI.Point | null;
  data: PIXI.InteractionData | null;
  inputSocketArray: InputSocket[];
  outputSocketArray: OutputSocket[];
  type: string;
  id: number | null;
  clickedOutputRef: null | OutputSocket;

  constructor(node: NodeData, graph: PPGraph) {
    super();
    this.graph = graph;
    this.id = null;
    this.name = node.name;
    this.type = node.type;
    this.inputSocketArray = [];
    this.outputSocketArray = [];
    this.clickedOutputRef = null;

    const inputNameText = new PIXI.Text(this.name, NODE_TEXTSTYLE);
    inputNameText.x = NODE_OUTLINE_DISTANCE + NODE_HEADER_TEXTMARGIN_LEFT;
    inputNameText.y =
      NODE_OUTLINE_DISTANCE + NODE_MARGIN_TOP + NODE_HEADER_TEXTMARGIN_TOP;
    inputNameText.resolution = 8;

    const background = new PIXI.Graphics();

    this._BackgroundRef = this.addChild(background);
    this._NodeNameRef = this.addChild(inputNameText);

    // adding outputs
    if (node.outputs) {
      for (let index = 0; index < node.outputs.length; index++) {
        const outputSocket = new OutputSocket(
          node.outputs[index].name,
          node.outputs[index].type
        );
        const outputSocketRef = this.addChild(outputSocket);
        outputSocketRef.y =
          NODE_MARGIN_TOP + NODE_HEADER_HEIGHT + index * INPUTSOCKET_HEIGHT;
        this.outputSocketArray.push(outputSocketRef);
      }
    }

    // adding inputs
    if (node.inputs) {
      for (let index = 0; index < node.inputs.length; index++) {
        const inputSocket = new InputSocket(
          node.inputs[index].name,
          node.inputs[index].type
        );
        const inputSocketRef = this.addChild(inputSocket);
        inputSocketRef.y =
          NODE_MARGIN_TOP +
          NODE_HEADER_HEIGHT +
          (node.outputs === undefined
            ? 0
            : node.outputs.length * OUTPUTSOCKET_HEIGHT) +
          index * INPUTSOCKET_HEIGHT;
        this.inputSocketArray.push(inputSocketRef);
      }
    }

    // draw shape
    this.updateShape(this._selected);

    this.interactive = true;
    this.data = null;
    this.relativeClickPosition = null;
    this.clickPosition = null;
    this.dragging = false;
    this._selected = false;

    this._addListeners();
  }

  // GETTERS & SETTERS

  get nodeNameRef(): PIXI.DisplayObject {
    return this._NodeNameRef;
  }

  get selected(): boolean {
    return this._selected;
  }

  get nodeTitle(): string {
    return this._NodeNameRef.text;
  }

  set nodeTitle(text: string) {
    this._NodeNameRef.text = text;
  }

  // METHODS
  select(selected: boolean): void {
    this._selected = selected;
    this.updateShape(selected);
  }

  addInput(name: string, type: string): void {
    const inputSocket = new InputSocket(name, type);
    const inputSocketRef = this.addChild(inputSocket);
    inputSocketRef.y =
      NODE_MARGIN_TOP +
      NODE_HEADER_HEIGHT +
      this.inputSocketArray.length * INPUTSOCKET_HEIGHT;

    this.inputSocketArray.push(inputSocketRef);

    // redraw background due to size change
    this.updateShape(this._selected);
  }

  updateShape(selected: boolean): void {
    // redraw background due to size change
    this._BackgroundRef.clear();
    this._BackgroundRef.beginFill(nodeBackgroundColorHex);
    this._BackgroundRef.drawRoundedRect(
      NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH / 2,
      NODE_OUTLINE_DISTANCE + 0,
      NODE_WIDTH,
      NODE_MARGIN_TOP +
        NODE_HEADER_HEIGHT +
        this.inputSocketArray.length * INPUTSOCKET_HEIGHT +
        this.outputSocketArray.length * OUTPUTSOCKET_HEIGHT +
        NODE_MARGIN_BOTTOM,
      NODE_CORNERRADIUS
    );
    this._BackgroundRef.endFill();
    if (selected) {
      this._BackgroundRef.lineStyle(1, 0xff00ff, 1, 0);
      this._BackgroundRef.drawRoundedRect(
        INPUTSOCKET_WIDTH / 2,
        0,
        NODE_OUTLINE_DISTANCE * 2 + NODE_WIDTH,
        NODE_OUTLINE_DISTANCE * 2 +
          NODE_MARGIN_TOP +
          NODE_HEADER_HEIGHT +
          this.inputSocketArray.length * INPUTSOCKET_HEIGHT +
          this.outputSocketArray.length * OUTPUTSOCKET_HEIGHT +
          NODE_MARGIN_BOTTOM,
        NODE_CORNERRADIUS + NODE_OUTLINE_DISTANCE
      );
    }
  }

  // SETUP

  _addListeners(): void {
    this.on('pointerdown', this._onPointerDown.bind(this));
    this.on('pointerup', this._onPointerUpAndUpOutside.bind(this));
    this.on('pointerupoutside', this._onPointerUpAndUpOutside.bind(this));
    this.on('pointermove', this._onPointerMove.bind(this));
    this.on('pointerover', this._onPointerOver.bind(this));
    this.on('pointerout', this._onPointerOut.bind(this));
    this.on('click', this._onClick.bind(this));
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    const node = event.target as PPNode;

    if (node.clickedOutputRef === null) {
      // start dragging
      console.log('_onPointerDown');
      this.data = event.data;
      this.clickPosition = new PIXI.Point(
        (event.data.originalEvent as PointerEvent).screenX,
        (event.data.originalEvent as PointerEvent).screenY
      );
      this.cursor = 'grabbing';
      this.alpha = 0.5;
      this.dragging = true;
      const localPositionX = this.position.x;
      const localPositionY = this.position.y;
      const localClickPosition = this.data.getLocalPosition(this.parent);
      const localClickPositionX = localClickPosition.x;
      const localClickPositionY = localClickPosition.y;
      const deltaX = localClickPositionX - localPositionX;
      const deltaY = localClickPositionY - localPositionY;
      this.relativeClickPosition = new PIXI.Point(deltaX, deltaY);
    }
  }

  _onPointerUpAndUpOutside(event: PIXI.InteractionEvent): void {
    const evData = event.data.originalEvent as PointerEvent;
    // if real dragend
    if (this.clickPosition !== null) {
      if (
        Math.abs(this.clickPosition.x - evData.screenX) < 2 ||
        Math.abs(this.clickPosition.y - evData.screenY) < 2
      ) {
        this._onClick();
      } else {
        event.stopPropagation();
      }
    }

    this.alpha = 1;
    this.dragging = false;
    // set the interaction data to null
    this.data = null;
  }

  _onPointerMove(): void {
    if (
      this.dragging &&
      this.data !== null &&
      this.relativeClickPosition !== null
    ) {
      const newPosition = this.data.getLocalPosition(this.parent);
      this.x = newPosition.x - this.relativeClickPosition.x;
      this.y = newPosition.y - this.relativeClickPosition.y;

      // check for connections and move them too
      this.outputSocketArray.map((output) => {
        output.links.map((link) => {
          link.updateConnection();
        });
      });
      this.inputSocketArray.map((input) => {
        if (input.link !== null) {
          input.link.updateConnection();
        }
      });
    }
  }

  _onPointerOver(): void {
    this.cursor = 'move';
  }

  _onPointerOut(): void {
    if (!this.dragging) {
      this.alpha = 1.0;
      this.cursor = 'default';
    }
  }

  _onClick(): void {
    if (this._selected && !this.dragging) {
      this.select(false);
      this.cursor = 'pointer';
    } else {
      this.select(true);
      this.cursor = 'move';
    }
  }
}
