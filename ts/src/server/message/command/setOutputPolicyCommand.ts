import type { Entity } from "../../../game/entity/entity.ts";
import type { OutputPolicy } from "../../../game/component/outputPolicyComponent.ts";

export type SetOutputPolicyCommand = {
    id: typeof SetOutputPolicyCommandId;
    building: string;
    policy: OutputPolicy;
};

export function SetOutputPolicyCommand(
    building: Entity,
    policy: OutputPolicy,
): SetOutputPolicyCommand {
    return {
        id: SetOutputPolicyCommandId,
        building: building.id,
        policy,
    };
}

export const SetOutputPolicyCommandId = "setOutputPolicy";
