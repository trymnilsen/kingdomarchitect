import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import {
    DayComponentId,
    createDayComponent,
    derivePhaseState,
} from "../component/dayComponent.ts";
import { formGoblinRaid } from "../raid/goblinRaid.ts";

/**
 * Advances the day/night phase on each tick by comparing the tick-derived
 * phase against the current DayComponent state. Only updates and replicates
 * when the phase actually changes (at most 4 times per cycle).
 */
export function createPhaseTransitionSystem(): EcsSystem {
    return {
        onInit: (root) => {
            if (!root.getEcsComponent(DayComponentId)) {
                root.setEcsComponent(createDayComponent());
            }
        },
        onUpdate: (root, tick) => {
            const day = root.requireEcsComponent(DayComponentId);
            const derived = derivePhaseState(tick);
            const phaseChanged = derived.phase !== day.phase;

            if (phaseChanged) {
                if (derived.phase === "night") {
                    formGoblinRaid(root);
                }

                root.updateComponent(DayComponentId, (comp) => {
                    comp.phase = derived.phase;
                    comp.currentDay = derived.currentDay;
                    comp.daysSurvived = derived.daysSurvived;
                });
            }
        },
    };
}
