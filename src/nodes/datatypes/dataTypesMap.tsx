import { AnyType } from './anyType';
import { ArrayType } from './arrayType';
import { BooleanType } from './booleanType';
import { CodeType } from './codeType';
import { ColorType } from './colorType';
import { EnumType } from './enumType';
import { ImageType } from './imageType';
import { JSONType } from './jsonType';
import { NumberType } from './numberType';
import { PixiType } from './pixiType';
import { StringType } from './stringType';
import { TriggerType } from './triggerType';

// I hate this
export const allDataTypes = {
  AnyType: AnyType,
  ArrayType: ArrayType,
  BooleanType: BooleanType,
  ColorType: ColorType,
  NumberType: NumberType,
  PixiType: PixiType,
  StringType: StringType,
  TriggerType: TriggerType,
  JSONType: JSONType,
  ImageType: ImageType,
  CodeType: CodeType,
  EnumType: EnumType,
};
