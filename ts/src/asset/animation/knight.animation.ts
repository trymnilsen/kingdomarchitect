import { sprites } from "../../../generated/sprites.js";
import type { AnimationGraph } from "../../rendering/animation/animationGraph.js";

export const nobleKnightAnimationGraph: AnimationGraph = {
    animationSet: {
        // --- Idle Animations ---
        idle_down: sprites.knight_idle_down,
        idle_up: sprites.knight_idle_up,
        idle_left: sprites.knight_idle_left,
        idle_right: sprites.knight_idle_right,

        // --- Walk Animations ---
        walk_down: sprites.knight,
        walk_up: sprites.knight_up,
        walk_left: sprites.knight_left,
        walk_right: sprites.knight_right,
    },
    initialState: "Idle",
    globalTransitions: [
        {
            event: "MOVEMENT",
            target: "Walking",
        },
    ],
    states: {
        Idle: {
            speed: 8,
            type: "loop",
            animation: "idle_{direction}",
        },
        Walking: {
            type: "single",
            animation: "walk_{direction}",
        },
        Attacking: {
            type: "single",
            animation: "attack_{direction}",
        },
    },
};
