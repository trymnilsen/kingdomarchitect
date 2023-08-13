import { JSONValue } from "../common/object.js";

export interface Persistable<T extends JSONValue = {}> {
    fromBundle(bundle: T): void;
    toBundle(): T;
}
