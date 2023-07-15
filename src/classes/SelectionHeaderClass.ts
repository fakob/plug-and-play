import * as PIXI from 'pixi.js';
import PPGraph from './GraphClass';
import Button from './ButtonClass';
import { TAlignOptions } from '../utils/interfaces';
import {
  ALIGNOPTIONS,
  ALIGNLEFT_TEXTURE,
  ALIGNCENTERHORIZONTALLY_TEXTURE,
  ALIGNRIGHT_TEXTURE,
  ALIGNTOP_TEXTURE,
  ALIGNCENTERVERTICALLY_TEXTURE,
  ALIGNBOTTOM_TEXTURE,
  DISTRIBUTEHORIZONTAL_TEXTURE,
  DISTRIBUTEVERTICAL_TEXTURE,
} from '../utils/constants';

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
      this.onPointerDown(e, ALIGNOPTIONS.ALIGN_LEFT)
    );
    this.alignCenterHorizontal = new Button(
      ALIGNCENTERHORIZONTALLY_TEXTURE,
      16
    );
    this.alignCenterHorizontal.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, ALIGNOPTIONS.ALIGN_CENTER_HORIZONTAL)
    );
    this.alignRight = new Button(ALIGNRIGHT_TEXTURE, 16);
    this.alignRight.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, ALIGNOPTIONS.ALIGN_RIGHT)
    );

    this.alignTop = new Button(ALIGNTOP_TEXTURE, 16);
    this.alignTop.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, ALIGNOPTIONS.ALIGN_TOP)
    );
    this.alignCenterVertical = new Button(ALIGNCENTERVERTICALLY_TEXTURE, 16);
    this.alignCenterVertical.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, ALIGNOPTIONS.ALIGN_CENTER_VERTICAL)
    );
    this.alignBottom = new Button(ALIGNBOTTOM_TEXTURE, 16);
    this.alignBottom.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, ALIGNOPTIONS.ALIGN_BOTTOM)
    );
    this.distributeVertical = new Button(DISTRIBUTEVERTICAL_TEXTURE, 16);
    this.distributeVertical.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, ALIGNOPTIONS.DISTRIBUTE_VERTICAL)
    );
    this.distributeHorizontal = new Button(DISTRIBUTEHORIZONTAL_TEXTURE, 16);
    this.distributeHorizontal.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, ALIGNOPTIONS.DISTRIBUTE_HORIZONTAL)
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
    alignAndDistribute: TAlignOptions
  ): Promise<void> {
    event.stopPropagation();
    PPGraph.currentGraph.selection.action_alignNodes(alignAndDistribute);
  }
}
