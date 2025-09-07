import type { Sprite2 } from "../../asset/sprite.js";
import { nameof } from "../../common/nameof.js";

// Define the valid values for the {direction} placeholder
export type Direction = "up" | "down" | "left" | "right";
export type AnimationPrefix = "idle" | "walk" | "attack" | "hit";

// --- Generated Template Literal Types for Validation ---

// Creates a type for all possible valid animation keys, e.g., "walk_down"
export type ValidAnimationKey = `${AnimationPrefix}_${Direction}`;

// Creates a type for all valid animation templates, e.g., "walk_{direction}"
export type AnimationTemplate = `${AnimationPrefix}_{direction}`;

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
    animationSet: Partial<Record<string, Sprite2>>;
    initialState: keyof T;
    globalTransitions: AnimationTransition[];
    states: Record<string, AnimationState>;
};
