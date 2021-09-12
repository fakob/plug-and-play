import { inspect } from 'util';
import { DefaultOutputWidget, SliderWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class PixiType extends AbstractType {
  constructor() {
    super();
  }

  // AFAIK no widget for this correct? so just returning empty

  getInputWidget = (data: any): any => {
    return null;
  };

  getComment(commentData: any): string {
    const strippedCommentData = {
      alpha: commentData?.alpha,
      // children: commentData?.children,
      // parent: commentData?.parent,
      // transform: commentData?.transform,
      visible: commentData?.visible,
      height: commentData?.height,
      pivot: commentData?.pivot,
      position: commentData?.position,
      rotation: commentData?.rotation,
      scale: commentData?.scale,
      width: commentData?.width,
      x: commentData?.x,
      y: commentData?.y,
      zIndex: commentData?.zIndex,
      bounds: commentData?.getBounds(),
      localBounds: commentData?.getLocalBounds(),
    };
    return inspect(strippedCommentData, null, 1);
  }
}
