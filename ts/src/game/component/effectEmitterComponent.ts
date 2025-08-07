import type { GameEffect } from "../../server/message/effect/gameEffect.js";

export type EffectEmitterComponent = {
    id: typeof EffectEmitterComponentId;
    emitter: (effect: GameEffect) => void;
};

export const EffectEmitterComponentId = "EffectEmitter";

export function createEffectEmitterComponent(
    emitter: (effect: GameEffect) => void,
): EffectEmitterComponent {
    return {
        id: EffectEmitterComponentId,
        emitter,
    };
}
