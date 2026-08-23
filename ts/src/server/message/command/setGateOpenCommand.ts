import type { Entity } from "../../../game/entity/entity.ts";

export type SetGateOpenCommand = {
    id: typeof SetGateOpenCommandId;
    gate: string;
    isOpen: boolean;
};

export function SetGateOpenCommand(
    gate: Entity,
    isOpen: boolean,
): SetGateOpenCommand {
    return {
        id: SetGateOpenCommandId,
        gate: gate.id,
        isOpen,
    };
}

export const SetGateOpenCommandId = "setGateOpen";
