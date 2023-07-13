import * as PIXI from 'pixi.js';
import PPGraph from './GraphClass';
import Button from './ButtonClass';
import { ActionHandler } from '../utils/actionHandler';
import { TAlignAndDistribute } from '../utils/interfaces';
import {
  ALIGNLEFT_TEXTURE,
  ALIGNCENTERHORIZONTALLY_TEXTURE,
  ALIGNRIGHT_TEXTURE,
  ALIGNTOP_TEXTURE,
  ALIGNCENTERVERTICALLY_TEXTURE,
  ALIGNBOTTOM_TEXTURE,
} from '../utils/constants';
import PPNode from './NodeClass';

export default class SelectionHeaderClass extends PIXI.Container {
  alignLeft: Button;
  alignCenterHorizontal: Button;
  alignRight: Button;
  alignTop: Button;
  alignCenterVertical: Button;
  alignBottom: Button;

  constructor() {
    super();

    this.alignLeft = new Button(ALIGNLEFT_TEXTURE);
    this.alignLeft.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignLeft')
    );
    this.alignCenterHorizontal = new Button(ALIGNCENTERHORIZONTALLY_TEXTURE);
    this.alignCenterHorizontal.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignCenterHorizontal')
    );
    this.alignRight = new Button(ALIGNRIGHT_TEXTURE);
    this.alignRight.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignRight')
    );

    this.alignTop = new Button(ALIGNTOP_TEXTURE);
    this.alignTop.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignTop')
    );
    this.alignCenterVertical = new Button(ALIGNCENTERVERTICALLY_TEXTURE);
    this.alignCenterVertical.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignCenterVertical')
    );
    this.alignBottom = new Button(ALIGNBOTTOM_TEXTURE);
    this.alignBottom.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignBottom')
    );

    this.addChild(this.alignLeft);
    this.addChild(this.alignCenterHorizontal);
    this.addChild(this.alignRight);
    this.addChild(this.alignTop);
    this.addChild(this.alignCenterVertical);
    this.addChild(this.alignBottom);

    this.alignLeft.x = 0;
    this.alignCenterHorizontal.x = 24;
    this.alignRight.x = 48;
    this.alignTop.x = 72;
    this.alignCenterVertical.x = 96;
    this.alignBottom.x = 120;
  }

  async onPointerDown(
    event: PIXI.FederatedPointerEvent,
    alignAndDistribute: TAlignAndDistribute
  ): Promise<void> {
    event.stopPropagation();

    const selection = PPGraph.currentGraph.selection;
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = -Number.MAX_VALUE;
    let maxY = -Number.MAX_VALUE;
    selection.selectedNodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const oldNodePositions = selection.selectedNodes.map((node) => ({
      x: node.x,
      y: node.y,
    }));
    const nodeIDs = selection.selectedNodes.map((node) => node.id);

    function alignNodes(node: PPNode, alignAndDistribute: TAlignAndDistribute) {
      switch (alignAndDistribute) {
        case 'alignLeft':
          node.x = minX;
          break;
        case 'alignCenterHorizontal':
          node.x = minX + (maxX - minX) / 2 - node.width / 2;
          break;
        case 'alignRight':
          node.x = maxX - node.width;
          break;
        case 'alignTop':
          node.y = minY;
          break;
        case 'alignCenterVertical':
          node.y = minY + (maxY - minY) / 2 - node.height / 2;
          break;
        case 'alignBottom':
          node.y = maxY - node.height;
          break;
      }
      node.updateConnectionPosition();
    }

    const doMove = async () => {
      nodeIDs.forEach((id) => {
        const node = PPGraph.currentGraph.nodes[id];
        console.log(alignAndDistribute);
        alignNodes(node, alignAndDistribute);
      });
      selection.drawRectanglesFromSelection();
    };

    const undoMove = async () => {
      nodeIDs.forEach((id, index) => {
        const node = PPGraph.currentGraph.nodes[id];
        const oldPosition = oldNodePositions[index];
        node.setPosition(oldPosition.x, oldPosition.y);
      });
      selection.drawRectanglesFromSelection();
    };

    await ActionHandler.performAction(doMove, undoMove, 'Align node(s)');
  }
}
