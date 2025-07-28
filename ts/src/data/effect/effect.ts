import { JSONValue } from "../../common/object.js";
import { Sprite2Id } from "../../asset/sprite.js";

export type Effect<T = JSONValue> = {
    id: string;
    time: number;
    data: T;
    name: string;
    sprite: Sprite2Id;
};
