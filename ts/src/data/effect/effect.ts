import type { JSONValue } from "../../common/object.ts";
import type { Sprite2Id } from "../../asset/sprite.ts";

export type EffectTiming =
    | { type: "immediate" }
    | { type: "delayed"; ticks: number }
    | { type: "periodic"; ticks: number; interval: number }
    /**
     * Persistent effects run their executor every tick and are never auto-removed.
     * They must be explicitly removed via removeEffectsBySource.
     * Used for ongoing conditions like exhaustion that last until cleared.
     */
    | { type: "persistent" };

export type Effect<T = JSONValue> = {
    id: string;
    timing: EffectTiming;
    data: T;
    name: string;
    sprite: Sprite2Id;
};
