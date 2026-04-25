import type { Entity } from "../entity.ts";

export type EntityGameEvent = {
    id: "game";
    source: Entity;
    data: {
        type: string;
        payload: unknown;
    };
};
