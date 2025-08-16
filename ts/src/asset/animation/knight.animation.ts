import type { AnimationGraph } from "../../rendering/animation/animationGraph.js";

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
        idle_down: { type: "loop", frames: [0] },
        idle_up: { type: "loop", frames: [8] },
        idle_left: { type: "loop", frames: [16] },
        idle_right: { type: "loop", frames: [24] },

        // --- Walk Animations ---
        walk_down: {
            type: "loop",
            frames: [0, 1, 2, 3],
        },
        walk_up: {
            type: "loop",
            frames: [8, 9, 10, 11],
        },
        walk_left: {
            type: "loop",
            frames: [16, 17, 18, 19],
        },
        walk_right: {
            type: "loop",
            frames: [24, 25, 26, 27],
        },

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
