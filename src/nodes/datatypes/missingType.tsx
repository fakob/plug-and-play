import * as PIXI from 'pixi.js';
import React from 'react';
import { Button } from '@mui/material';
import { TRgba } from '../../utils/interfaces';
import { AbstractType, DataTypeProps } from './abstractType';

export interface MissingTypeProps extends DataTypeProps {
  dataType: MissingType;
}

const MissingSocketWidget: React.FunctionComponent<MissingTypeProps> = (
  props,
) => {
  return (
    <Button
      onClick={() => {
        props.property.getNode().removeSocket(props.property);
      }}
      variant="contained"
      fullWidth
    >
      Delete socket
    </Button>
  );
};

export class MissingType extends AbstractType {
  getName(): string {
    return 'Missing';
  }

  getColor(): TRgba {
    return new TRgba(255, 0, 0);
  }

  getInputWidget = (props: MissingTypeProps): any => {
    props.dataType = this;
    return <MissingSocketWidget {...props} />;
  };

  getOutputWidget = (props: MissingTypeProps): any => {
    props.dataType = this;
    return <MissingSocketWidget {...props} />;
  };

  drawValueSpecificGraphics(graphics: PIXI.Graphics, data: any) {
    super.drawValueSpecificGraphics(graphics, data);
    graphics.beginFill(new TRgba(255, 0, 0).hex());
    graphics.drawRect(-8, -8, 16, 16);
  }
}
