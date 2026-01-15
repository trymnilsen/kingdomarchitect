/**
 * Examples of how to integrate the GOAP urgency system with various game systems.
 * These are example patterns - adapt them to your specific use cases.
 */

import type { Entity } from "../entity/entity.ts";
import { GoapAgentComponentId } from "../component/goapAgentComponent.ts";
import { requestReplan, ReplanUrgency } from "./goapReplanTrigger.ts";

/**
 * Example 1: Combat / Damage Events
 * When an entity takes damage, immediately replan (critical urgency).
 */
export function exampleCombatDamage(
    entity: Entity,
    damage: number,
    tick: number,
): void {
    // Apply damage logic here...

    const goapAgent = entity.getEcsComponent(GoapAgentComponentId);
    if (goapAgent) {
        requestReplan(
            goapAgent,
            ReplanUrgency.Critical,
            `took ${damage} damage`,
            tick,
        );
    }
}

/**
 * Example 2: Player Commands
 * When player commands an entity to move or act, bypass cooldown (critical urgency).
 */
export function examplePlayerCommand(
    entity: Entity,
    commandType: string,
    tick: number,
): void {
    // Set command component...

    const goapAgent = entity.getEcsComponent(GoapAgentComponentId);
    if (goapAgent) {
        requestReplan(
            goapAgent,
            ReplanUrgency.Critical,
            `player commanded: ${commandType}`,
            tick,
        );
    }
}

/**
 * Example 3: Critical Need Threshold
 * When hunger/energy crosses critical threshold, request high-priority replan.
 * High urgency can bypass cooldown if at least halfway through.
 */
export function exampleHungerThreshold(
    entity: Entity,
    hungerLevel: number,
    tick: number,
): void {
    const wasHungry = hungerLevel > 70;
    // Update hunger...
    const isNowHungry = hungerLevel > 70;

    if (!wasHungry && isNowHungry) {
        const goapAgent = entity.getEcsComponent(GoapAgentComponentId);
        if (goapAgent) {
            requestReplan(
                goapAgent,
                ReplanUrgency.High,
                `hunger critical (${hungerLevel.toFixed(1)})`,
                tick,
            );
        }
    }
}

/**
 * Example 4: Low-Priority State Changes
 * When entity picks up item, queue replan (low urgency - respects cooldown).
 * Agent might want to use new item, but it's not urgent.
 */
export function exampleInventoryChange(
    entity: Entity,
    itemId: string,
    tick: number,
): void {
    // Add item to inventory...

    const goapAgent = entity.getEcsComponent(GoapAgentComponentId);
    if (goapAgent) {
        requestReplan(
            goapAgent,
            ReplanUrgency.Low,
            `acquired item: ${itemId}`,
            tick,
        );
    }
}

/**
 * Example 5: Job Assignment
 * When new job becomes available, request high-priority replan.
 * Idle workers should respond relatively quickly, but not instantly.
 */
export function exampleJobAvailable(
    entity: Entity,
    jobType: string,
    tick: number,
): void {
    const goapAgent = entity.getEcsComponent(GoapAgentComponentId);
    if (goapAgent) {
        requestReplan(
            goapAgent,
            ReplanUrgency.High,
            `new job available: ${jobType}`,
            tick,
        );
    }
}

/**
 * Example 6: Environmental Hazard
 * When entity enters dangerous area (fire, poison cloud), critical replan.
 */
export function exampleEnvironmentalDanger(
    entity: Entity,
    hazardType: string,
    tick: number,
): void {
    const goapAgent = entity.getEcsComponent(GoapAgentComponentId);
    if (goapAgent) {
        requestReplan(
            goapAgent,
            ReplanUrgency.Critical,
            `entered hazard: ${hazardType}`,
            tick,
        );
    }
}

/**
 * Example 7: Sound Alert
 * When entity hears important sound (alarm, cry for help), high urgency.
 */
export function exampleSoundAlert(
    entity: Entity,
    soundType: string,
    tick: number,
): void {
    const goapAgent = entity.getEcsComponent(GoapAgentComponentId);
    if (goapAgent) {
        requestReplan(
            goapAgent,
            ReplanUrgency.High,
            `heard sound: ${soundType}`,
            tick,
        );
    }
}
