import { AbstractType } from './abstractType';
import { allDataTypes } from './dataTypesMap';

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
  console.log(JSON.stringify(serialized));
  return JSON.stringify(serialized);
}

export function deSerializeType(serialized: string): AbstractType {
  const unSerialized: SerializedType = JSON.parse(serialized);
  console.log(JSON.parse(serialized));
  return Object.assign(
    new allDataTypes[unSerialized.class](),
    unSerialized.type
  );
}
