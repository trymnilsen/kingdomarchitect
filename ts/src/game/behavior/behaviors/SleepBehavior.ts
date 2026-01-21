import { Entity } from "../../entity/entity.ts";
import { EnergyComponentId } from "../../component/energyComponent.ts";
import type { BehaviorActionData } from "../actions/Action.ts";
import type { Behavior } from "./Behavior.ts";

/**
 * SleepBehavior causes an entity to sleep when energy is low.
 * Utility scales with tiredness - the more tired, the higher the priority.
 */
export function createSleepBehavior(): Behavior {
    return {
        name: "sleep",

        isValid(entity: Entity): boolean {
            const energy = entity.getEcsComponent(
                EnergyComponentId,
            );
            if (!energy) {
                return false;
            }

            // Valid when energy drops below 30
            return energy.energy < 30;
        },

        utility(entity: Entity): number {
            const energy = entity.getEcsComponent(
                EnergyComponentId,
            );
            if (!energy) {
                return 0;
            }

            // Utility scales with tiredness
            // energy 30: utility = 60
            // energy 20: utility = 66
            // energy 10: utility = 73
            // energy 0: utility = 80
            // This ensures sleep takes priority over normal work (40-60) when very tired
            if (energy.energy < 30) {
                return 60 + (30 - energy.energy) * 0.67;
            }

            return 0;
        },

        expand(_entity: Entity): BehaviorActionData[] {
            // For now, just sleep in place
            // TODO: In the future, this could include moveTo action to find a bed
            return [{ type: "sleep" }];
        },
    };
}
