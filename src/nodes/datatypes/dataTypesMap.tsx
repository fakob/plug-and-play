import { AnyType } from './anyType';
import { ArrayType } from './arrayType';
import { BooleanType } from './booleanType';
import { CodeType } from './codeType';
import { ColorType } from './colorType';
import { DeferredPixiType } from './deferredPixiType';
import { EnumType } from './enumType';
import { ImageType } from './imageType';
import { JSONType } from './jsonType';
import { NumberType } from './numberType';
import { StringType } from './stringType';
import { TriggerType } from './triggerType';

// I hate this but what can you do
export const allDataTypes = {
  AnyType: AnyType,
  ArrayType: ArrayType,
  BooleanType: BooleanType,
  ColorType: ColorType,
  NumberType: NumberType,
  DeferredPixiType: DeferredPixiType,
  StringType: StringType,
  TriggerType: TriggerType,
  JSONType: JSONType,
  ImageType: ImageType,
  CodeType: CodeType,
  EnumType: EnumType,
};
