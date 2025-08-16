import type { AnimationGraph } from "../../rendering/animation/animationGraph.js";
import { sprites2 } from "../sprite.js";

type KnightAnimationStates = {
    Idle: {
        animation: "idle_{direction}";
        transitions: [
            { event: "MOVEMENT_START"; target: "Walking" },
            {
                event: "EFFECT_APPLIED";
                condition: { effectName: "attack" };
                target: "Attacking";
            },
        ];
    };
    Walking: {
        animation: "walk_{direction}";
        transitions: [
            { event: "MOVEMENT_STOP"; target: "Idle" },
            {
                event: "EFFECT_APPLIED";
                condition: { effectName: "attack" };
                target: "Attacking";
            },
        ];
    };
    Attacking: {
        animation: "attack_{direction}";
        transitions: []; // Auto-returns to Idle
    };
};

export const nobleKnightAnimationGraph: AnimationGraph = {
    animationSet: {
        // --- Idle Animations ---
        idle_down: { type: "loop", sprite: sprites2.knight_idle_down },
        idle_up: { type: "loop", sprite: sprites2.knight_idle_up },
        idle_left: { type: "loop", sprite: sprites2.knight_idle_left },
        idle_right: { type: "loop", sprite: sprites2.knight_idle_right },

        // --- Walk Animations ---
        walk_down: {
            type: "loop",
            sprite: sprites2.knight,
        },
        walk_up: {
            type: "loop",
            sprite: sprites2.knight_up,
        },
        walk_left: {
            type: "loop",
            sprite: sprites2.knight_left,
        },
        walk_right: {
            type: "loop",
            sprite: sprites2.knight_right,
        },
        /*
        // --- Attack Animations ---
        attack_down: {
            type: "single",
            frames: [32, 33, 34],
        },
        attack_up: {
            type: "single",
            frames: [40, 41, 42],
        },
        attack_left: {
            type: "single",
            frames: [48, 49, 50],
        },
        attack_right: {
            type: "single",
            frames: [56, 57, 58],
        },
*/
    },
    initialState: "Idle",
    globalTransitions: [
        {
            event: "movement",
            target: "Walking",
        },
    ],
    states: {
        Idle: {
            animation: "idle_{direction}",
        },
        Walking: {
            animation: "walk_{direction}",
        },
        Attacking: {
            animation: "attack_{direction}",
        },
    },
};
