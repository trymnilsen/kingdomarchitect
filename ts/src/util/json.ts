export interface JsonObject {
    [x: string]: Json;
}
export interface JsonArray extends Array<Json> {}

export type Json = string | number | boolean | Date | JsonObject | JsonArray;

export type JsonValueSubTypes =
    | string
    | number
    | boolean
    | JsonObject
    | JsonArray;
