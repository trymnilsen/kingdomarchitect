import type { SpriteRef } from "../../asset/sprite.ts";
import { nameof } from "../../common/nameof.ts";

export type Direction = "up" | "down" | "left" | "right";
export type Ordinal = "southeast" | "southwest" | "northeast" | "northwest";
export type AnimationPrefix = "idle" | "walk" | "attack" | "hit";

/** A resolved animation key, such as "walk_southeast". */
export type AnimationKey = `${AnimationPrefix}_${Ordinal}`;

/** An unresolved key, such as "walk_{direction}", filled in per entity. */
export type AnimationTemplate =
    | `${AnimationPrefix}_{direction}`
    | `${AnimationPrefix}_{ordinal}`;

type AnimationEventTransition = {
    event: string;
    target: string;
};

type AnimationEffectTransition = {
    effect: string;
    target: string;
};

export type AnimationTransition =
    | AnimationEventTransition
    | AnimationEffectTransition;

export function isEventTransition(
    transition: AnimationTransition,
): transition is AnimationEventTransition {
    return nameof<AnimationEventTransition>("event") in transition;
}

export type AnimationState = {
    type: "loop" | "single";
    animation: AnimationTemplate;
    speed?: number;
    transitions?: AnimationTransition[];
};

export type AnimationStateMap = Record<string, AnimationState>;

export type AnimationGraph<T extends AnimationStateMap = AnimationStateMap> = {
    initialState: keyof T;
    globalTransitions: AnimationTransition[];
    states: Record<string, AnimationState>;
};

/**
 * Creates a simple looping animation graph for sprites that don't need
 * state transitions. Useful for environmental animations like fires,
 * water, or other ambient effects.
 *
 * @param sprite The sprite to loop through its frames
 * @param speed Number of ticks between frame changes (default: 8)
 * @returns An AnimationGraph with a single looping state
 */
export function loopAnimation(
    sprite: SpriteRef,
    speed: number = 8,
): AnimationGraph {
    const animationKey = sprite.spriteId;

    return {
        initialState: "Loop",
        globalTransitions: [],
        states: {
            Loop: {
                type: "loop",
                animation: animationKey as AnimationTemplate,
                speed,
            },
        },
    };
}
