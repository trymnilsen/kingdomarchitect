export type JSONValue =
    | string
    | number
    | boolean
    | null
    | { [x: string]: JSONValue }
    | JSONValue[];

export function hasOwnProperty(object: object, key: string) {
    return Object.prototype.hasOwnProperty.call(object, key);
}
