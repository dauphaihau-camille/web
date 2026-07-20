export type CollaborationBinary =
  | ArrayBuffer
  | Uint8Array
  | number[]
  | { data: number[]; type?: string };

export function toUint8Array(value: CollaborationBinary): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }

  return Uint8Array.from(value.data);
}
