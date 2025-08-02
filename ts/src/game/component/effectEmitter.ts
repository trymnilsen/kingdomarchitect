export type EffectEmitterComponent = {
    id: typeof EffectEmitterComponentId;
    
};

export const EffectEmitterComponentId = "EffectEmitter";

export function createEffectEmitterComponent(): EffectEmitterComponent {
    return {
        id: EffectEmitterComponentId,
    };
}
