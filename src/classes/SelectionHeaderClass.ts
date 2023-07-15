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
  DISTRIBUTEHORIZONTAL_TEXTURE,
  DISTRIBUTEVERTICAL_TEXTURE,
} from '../utils/constants';
import PPNode from './NodeClass';

export default class SelectionHeaderClass extends PIXI.Container {
  alignLeft: Button;
  alignCenterHorizontal: Button;
  alignRight: Button;
  alignTop: Button;
  alignCenterVertical: Button;
  alignBottom: Button;
  distributeHorizontal: Button;
  distributeVertical: Button;

  constructor() {
    super();

    this.alignLeft = new Button(ALIGNLEFT_TEXTURE, 16);
    this.alignLeft.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignLeft')
    );
    this.alignCenterHorizontal = new Button(
      ALIGNCENTERHORIZONTALLY_TEXTURE,
      16
    );
    this.alignCenterHorizontal.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignCenterHorizontal')
    );
    this.alignRight = new Button(ALIGNRIGHT_TEXTURE, 16);
    this.alignRight.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignRight')
    );

    this.alignTop = new Button(ALIGNTOP_TEXTURE, 16);
    this.alignTop.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignTop')
    );
    this.alignCenterVertical = new Button(ALIGNCENTERVERTICALLY_TEXTURE, 16);
    this.alignCenterVertical.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignCenterVertical')
    );
    this.alignBottom = new Button(ALIGNBOTTOM_TEXTURE, 16);
    this.alignBottom.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'alignBottom')
    );
    this.distributeVertical = new Button(DISTRIBUTEVERTICAL_TEXTURE, 16);
    this.distributeVertical.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'distributeVertical')
    );
    this.distributeHorizontal = new Button(DISTRIBUTEHORIZONTAL_TEXTURE, 16);
    this.distributeHorizontal.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, 'distributeHorizontal')
    );

    this.addChild(this.alignLeft);
    this.addChild(this.alignCenterHorizontal);
    this.addChild(this.alignRight);
    this.addChild(this.alignTop);
    this.addChild(this.alignCenterVertical);
    this.addChild(this.alignBottom);
    this.addChild(this.distributeHorizontal);
    this.addChild(this.distributeVertical);

    this.alignLeft.x = 0;
    this.alignCenterHorizontal.x = 20;
    this.alignRight.x = 40;
    this.alignTop.x = 68;
    this.alignCenterVertical.x = 88;
    this.alignBottom.x = 108;
    this.distributeVertical.x = 136;
    this.distributeHorizontal.x = 156;
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

    const nodeIDsPos = selection.selectedNodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    }));

    let incrementPos = 0;

    function alignNodes(
      node: PPNode,
      alignAndDistribute: TAlignAndDistribute,
      interval: number,
      index: number
    ) {
      let x;
      let y;
      switch (alignAndDistribute) {
        case 'alignLeft':
          x = minX;
          break;
        case 'alignCenterHorizontal':
          x = minX + (maxX - minX) / 2 - node.width / 2;
          break;
        case 'alignRight':
          x = maxX - node.width;
          break;
        case 'alignTop':
          y = minY;
          break;
        case 'alignCenterVertical':
          y = minY + (maxY - minY) / 2 - node.height / 2;
          break;
        case 'alignBottom':
          y = maxY - node.height;
          break;
        case 'distributeHorizontal':
          x = index === 0 ? minX : incrementPos + interval;
          incrementPos = x + node.width;
          break;
        case 'distributeVertical':
          y = index === 0 ? minY : incrementPos + interval;
          incrementPos = y + node.height;
          break;
      }
      node.setPosition(x, y);
    }

    const doMove = async () => {
      const calcInterval = (min, max, sum, length) =>
        (max - min - sum) / (length - 1);

      const sortedIDsAndPos = nodeIDsPos.sort((a, b) => {
        return alignAndDistribute === 'distributeVertical'
          ? a.y - b.y
          : a.x - b.x;
      });

      const sumOfWidthHeight =
        alignAndDistribute === 'distributeVertical'
          ? sortedIDsAndPos.reduce((n, { height }) => n + height, 0)
          : sortedIDsAndPos.reduce((n, { width }) => n + width, 0);

      const interval =
        alignAndDistribute === 'distributeVertical'
          ? calcInterval(minY, maxY, sumOfWidthHeight, nodeIDsPos.length)
          : calcInterval(minX, maxX, sumOfWidthHeight, nodeIDsPos.length);

      sortedIDsAndPos.forEach((idAndPos, index) => {
        const node = PPGraph.currentGraph.nodes[idAndPos.id];
        alignNodes(node, alignAndDistribute, interval, index);
      });
      incrementPos = 0; // reset

      selection.drawRectanglesFromSelection();
    };

    const undoMove = async () => {
      nodeIDsPos.forEach((idAndPos, index) => {
        const node = PPGraph.currentGraph.nodes[idAndPos.id];
        const oldPosition = nodeIDsPos[index];
        node.setPosition(oldPosition.x, oldPosition.y);
      });
      selection.drawRectanglesFromSelection();
    };

    await ActionHandler.performAction(doMove, undoMove, 'Align node(s)');
  }
}
