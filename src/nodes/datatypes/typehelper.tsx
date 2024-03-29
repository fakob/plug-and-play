import { TRgba } from '../../utils/interfaces';
import { AbstractType } from './abstractType';
import { AnyType } from './anyType';
import { ArrayType } from './arrayType';
import { BooleanType } from './booleanType';
import { ColorType } from './colorType';
import { allDataTypes } from './dataTypesMap';
import { FunctionType } from './functionType';
import { JSONType } from './jsonType';
import { NumberType } from './numberType';
import { StringType } from './stringType';

type SerializedType = {
  class: any;
  type: AbstractType;
};

// this is hacky but dont know how otherwise to do this in JS
export function serializeType(type: AbstractType): string {
  const serialized: SerializedType = {
    class: type.constructor.name,
    type: type,
  };
  return JSON.stringify(serialized);
}

export function deSerializeType(serialized: string): AbstractType {
  const unSerialized: SerializedType = JSON.parse(serialized);
  return Object.assign(
    new allDataTypes[unSerialized.class](),
    unSerialized.type
  );
}

export function dataToType(data: any) {
  if (data == undefined) {
    return new AnyType();
  } else if (typeof data == 'string') {
    // first see if we can parse it into something else, otherwise return as string
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return new ArrayType();
      } else if (typeof parsed == 'object') {
        return new JSONType();
      } else if (TRgba.isTRgba(parsed)) {
        return new ColorType();
      }
    } catch (e) {}
    return new StringType();
  } else if (typeof data == 'number') {
    return new NumberType();
  } else if (typeof data == 'boolean') {
    return new BooleanType();
  } else if (Array.isArray(data)) {
    return new ArrayType();
  } else if (TRgba.isTRgba(data)) {
    return new ColorType();
  } else if (typeof data == 'object') {
    return new JSONType();
  } else if (typeof data == 'function') {
    return new FunctionType();
  } else {
    return new AnyType();
  }
}
