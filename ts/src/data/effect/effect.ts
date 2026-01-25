import type { JSONValue } from "../../common/object.ts";
import type { Sprite2Id } from "../../asset/sprite.ts";

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
