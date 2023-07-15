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
    PPGraph.currentGraph.selection.action_alignNodes(alignAndDistribute);
  }
}
