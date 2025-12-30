import type { Entity } from "../../../game/entity/entity.ts";

export type AttackCommand = {
    id: typeof AttackCommandId;
    target: string;
    attacker: string;
};

export function AttackCommand(target: Entity, attacker: Entity): AttackCommand {
    return {
        id: AttackCommandId,
        target: target.id,
        attacker: attacker.id,
    };
}

export const AttackCommandId = "attack";
