import type { Entity } from "../../../game/entity/entity.ts";
import type { SearchlightMode } from "../../../game/component/watchComponent.ts";

export type SetSearchlightModeCommand = {
    id: typeof SetSearchlightModeCommandId;
    tower: string;
    mode: SearchlightMode;
};

export function SetSearchlightModeCommand(
    tower: Entity,
    mode: SearchlightMode,
): SetSearchlightModeCommand {
    return {
        id: SetSearchlightModeCommandId,
        tower: tower.id,
        mode,
    };
}

export const SetSearchlightModeCommandId = "setSearchlightMode";
