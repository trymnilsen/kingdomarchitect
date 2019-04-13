export interface Json {
    [x: string]: JsonValueTypes;
}
export interface JsonArray extends Array<JsonValueTypes> { }

export type JsonValueTypes =
    | string
    | number
    | boolean
    | Date
    | Json
    | JsonArray;
