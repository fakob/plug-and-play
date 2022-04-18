import { AnyType } from './anyType';
import { ArrayType } from './arrayType';
import { BooleanType } from './booleanType';
import { CodeType } from './codeType';
import { ColorType } from './colorType';
import { DeferredPixiType } from './deferredPixiType';
import { EnumType } from './enumType';
import { ImageType } from './imageType';
import { JSONType } from './jsonType';
import { MacroType } from './macroType';
import { NumberType } from './numberType';
import { PixiType } from './pixiType';
import { StringType } from './stringType';
import { TriggerType } from './triggerType';

// I hate this but what can you do
export const allDataTypes = {
  AnyType: AnyType,
  ArrayType: ArrayType,
  BooleanType: BooleanType,
  ColorType: ColorType,
  NumberType: NumberType,
  PixiType: PixiType,
  DeferredPixiType: DeferredPixiType,
  StringType: StringType,
  TriggerType: TriggerType,
  JSONType: JSONType,
  ImageType: ImageType,
  CodeType: CodeType,
  EnumType: EnumType,
  MacroType: MacroType,
};
