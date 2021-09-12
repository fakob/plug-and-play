import { AnyType } from './anyType';
import { ArrayType } from './arrayType';
import { BooleanType } from './booleanType';
import { ColorType } from './colorType';
import { NumberType } from './numberType';
import { PixiType } from './pixiType';
import { StringType } from './stringType';
import { TriggerType } from './triggerType';

export const allDataTypes = [
  new AnyType(),
  new ArrayType(),
  new BooleanType(),
  new ColorType(),
  new NumberType(),
  new PixiType(),
  new StringType(),
  new TriggerType(),
];
