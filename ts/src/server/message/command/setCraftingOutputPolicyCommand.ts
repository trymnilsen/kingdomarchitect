import type { Entity } from "../../../game/entity/entity.ts";
import type { CraftingOutputPolicy } from "../../../game/component/craftingComponent.ts";

export type SetCraftingOutputPolicyCommand = {
    id: typeof SetCraftingOutputPolicyCommandId;
    building: string;
    policy: CraftingOutputPolicy;
};

export function SetCraftingOutputPolicyCommand(
    building: Entity,
    policy: CraftingOutputPolicy,
): SetCraftingOutputPolicyCommand {
    return {
        id: SetCraftingOutputPolicyCommandId,
        building: building.id,
        policy,
    };
}

export const SetCraftingOutputPolicyCommandId = "setCraftingOutputPolicy";
