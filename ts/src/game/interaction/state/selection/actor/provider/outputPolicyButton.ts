import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { SetOutputPolicyCommand } from "../../../../../../server/message/command/setOutputPolicyCommand.ts";
import { OutputPolicy } from "../../../../../component/outputPolicyComponent.ts";
import type { Entity } from "../../../../../entity/entity.ts";
import type { StateContext } from "../../../../handler/stateContext.ts";
import type { UIActionbarItem } from "../../../../view/uiActionbar.ts";

export function outputPolicyButton(
    stateContext: StateContext,
    building: Entity,
): UIActionbarItem {
    const setPolicy = (policy: OutputPolicy) => () => {
        stateContext.commandDispatcher(
            SetOutputPolicyCommand(building, policy),
        );
    };
    return {
        text: "Output",
        icon: spriteRefs.empty_sprite,
        children: [
            {
                text: "Haul",
                icon: spriteRefs.empty_sprite,
                onClick: setPolicy(OutputPolicy.Haul),
            },
            {
                text: "Drop",
                icon: spriteRefs.empty_sprite,
                onClick: setPolicy(OutputPolicy.Drop),
            },
        ],
    };
}
