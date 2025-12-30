import type { Sprite2 } from "../../asset/sprite.ts";
import { nameof } from "../../common/nameof.ts";

// Define the valid values for the {direction} placeholder
export type Direction = "up" | "down" | "left" | "right";
export type Ordinal = "southeast" | "southwest" | "northeast" | "northwest";
export type AnimationPrefix = "idle" | "walk" | "attack" | "hit";

// --- Generated Template Literal Types for Validation ---

// Creates a type for all possible valid animation keys, e.g., "walk_down"
export type AnimationKey = `${AnimationPrefix}_${Ordinal}`;

// Creates a type for all valid animation templates, e.g., "walk_{direction}"
export type AnimationTemplate =
    | `${AnimationPrefix}_{direction}`
    | `${AnimationPrefix}_{ordinal}`;

// --- Main Data Structures ---

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
    sprite: Sprite2,
    speed: number = 8,
): AnimationGraph {
    const animationKey = sprite.id;

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
