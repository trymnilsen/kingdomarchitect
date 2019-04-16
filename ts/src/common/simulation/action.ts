import { Json, JsonObject } from "../json";

export interface Action<T = any> {
    name: string;
    data: T;
}
export function action<T extends {}>(name: string, data: T): Action<T> {
    return {
        name,
        data
    };
}
