import { Sprite2, Sprite2Id } from "../../module/asset/sprite.js";
import { JSONValue } from "../../common/object.js";

export type Effect<T = JSONValue> = {
    id: string;
    time: number;
    data: T;
    name: string;
    sprite: Sprite2Id;
};
