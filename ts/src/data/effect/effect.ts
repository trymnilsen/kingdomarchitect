import { JSONValue } from "../../common/object.js";
import { Sprite2Id } from "../../asset/sprite.js";

export type EffectTiming =
    | { type: "immediate" }
    | { type: "delayed"; ticks: number }
    | { type: "periodic"; ticks: number; interval: number };

export type Effect<T = JSONValue> = {
    id: string;
    timing: EffectTiming;
    data: T;
    name: string;
    sprite: Sprite2Id;
};
