import { AnyType } from './anyType';
import { ArrayType } from './arrayType';
import { BooleanType } from './booleanType';
import { CodeType } from './codeType';
import { ColorType } from './colorType';
import { DeferredPixiType } from './deferredPixiType';
import { DynamicEnumType } from './dynamicEnumType';
import { EnumType } from './enumType';
import { FileType } from './fileType';
import { FunctionType } from './functionType';
import { GraphInputType } from './graphInputType';
import { ImageType } from './imageType';
import { JSONType } from './jsonType';
import { NumberType } from './numberType';
import { StringType } from './stringType';
import { TriggerType } from './triggerType';
import { FormatJSONType } from './formatJSONFIeld';

// I hate this but what can you do
export const allDataTypes = {
  AnyType: AnyType,
  ArrayType: ArrayType,
  BooleanType: BooleanType,
  ColorType: ColorType,
  NumberType: NumberType,
  DeferredPixiType: DeferredPixiType,
  FileType: FileType,
  FunctionType: FunctionType,
  StringType: StringType,
  TriggerType: TriggerType,
  JSONType: JSONType,
  ImageType: ImageType,
  CodeType: CodeType,
  EnumType: EnumType,
  DynamicEnumType: DynamicEnumType,
  GraphInputType: GraphInputType,
  FormatJSONType: FormatJSONType,
};
