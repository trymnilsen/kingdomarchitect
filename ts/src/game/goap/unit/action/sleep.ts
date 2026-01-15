import {
    EnergyComponentId,
    increaseEnergy,
} from "../../../component/energyComponent.ts";
import type { GoapActionDefinition } from "../../../goap/goapAction.ts";
import {
    createWorldState,
    getState,
    setState,
} from "../../../goap/goapWorldState.ts";

/**
 * Execution data for the sleep action.
 */
export type SleepActionData = {
    /** Tick when sleeping started */
    startTick: number;
    /** Amount of energy to restore per tick */
    restoreRate: number;
};

/**
 * Sleep action - restore energy over time by sleeping.
 */
export const sleepAction: GoapActionDefinition<SleepActionData> = {
    id: "sleep",
    name: "Sleeping",

    getCost: () => 15,

    preconditions: (state, _ctx) => {
        // Must be tired (energy below threshold)
        const energy = parseInt(getState(state, "energy") || "100");
        if (energy >= 20) {
            return false;
        }

        return true;
    },

    getEffects: (_state) => {
        const effects = createWorldState();

        // Sleeping fully restores energy
        setState(effects, "energy", 100);
        setState(effects, "sleeping", "true");

        return effects;
    },

    createExecutionData: (ctx) => {
        const energy = ctx.agent.requireEcsComponent(EnergyComponentId);

        return {
            startTick: ctx.tick,
            restoreRate: energy.restoreRate,
        };
    },

    execute: (data, ctx) => {
        const energy = ctx.agent.requireEcsComponent(EnergyComponentId);

        // Restore energy over time
        increaseEnergy(energy, data.restoreRate);

        // Invalidate component to trigger replication
        ctx.agent.invalidateComponent(EnergyComponentId);

        // Check if fully rested
        if (energy.energy >= 100) {
            console.log(
                `Agent ${ctx.agent.id} finished sleeping. Energy: ${energy.energy}`,
            );
            return "complete";
        }

        // Continue sleeping
        return "in_progress";
    },

    postActionDelay: () => 1000, // 1 second pause per sleep tick
};
