import type { Entity } from "../entity/entity.ts";

export const OutputPolicy = {
    Haul: "haul",
    Drop: "drop",
} as const;

export type OutputPolicy = (typeof OutputPolicy)[keyof typeof OutputPolicy];

export type OutputPolicyComponent = {
    id: typeof OutputPolicyComponentId;
    policy: OutputPolicy;
};

export const OutputPolicyComponentId = "OutputPolicy";

export function createOutputPolicyComponent(): OutputPolicyComponent {
    return {
        id: OutputPolicyComponentId,
        policy: OutputPolicy.Haul,
    };
}

export function getOutputPolicy(building: Entity): OutputPolicy {
    return (
        building.getEcsComponent(OutputPolicyComponentId)?.policy ??
        OutputPolicy.Haul
    );
}
