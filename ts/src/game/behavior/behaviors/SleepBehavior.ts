import type { Entity } from "../../entity/entity.ts";
import {
    EnergyComponentId,
    type EnergyComponent,
} from "../../component/energyComponent.ts";
import { HousingComponentId } from "../../component/housingComponent.ts";
import { FireSourceComponentId } from "../../component/fireSourceComponent.ts";
import {
    ChunkMapComponentId,
    getEntitiesInChunkMapWithin,
} from "../../component/chunkMapComponent.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { isTileAvailable } from "../../map/path/graph/weight.ts";
import type { SleepQuality } from "../actions/Action.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";
import {
    resolveSleepEnergyPerTick,
    resolveSleepEnergyTarget,
} from "../actions/sleepAction.ts";
import type { Point } from "../../../common/point.ts";

const CAMPFIRE_SEARCH_RADIUS = 20;

/**
 * Energy fraction below which a worker wants to sleep. A fraction rather than a
 * point count, so retuning maxEnergy cannot silently move the trigger.
 */
export const SLEEP_THRESHOLD_FRACTION = 0.3;

/** Utility at the sleep threshold, before any exhaustion boost. */
export const SLEEP_UTILITY_BASE = 55;

/** How much utility climbs between the threshold and fully empty. */
export const SLEEP_UTILITY_RANGE = 20;

/**
 * Current energy as a fraction of the pool. Guards a zero pool, which would
 * otherwise produce NaN and silently disable sleeping altogether.
 */
function energyFraction(energy: EnergyComponent): number {
    return energy.energy / Math.max(1, energy.maxEnergy);
}

/**
 * SleepBehavior manages rest for workers. Activates when tired or exhausted.
 * Sleep quality depends on available shelter: house > bedroll+fire > bedroll > collapse.
 * At exhaustion level 4 the worker collapses in place immediately.
 */
export function createSleepBehavior(): Behavior {
    return {
        name: "sleep",

        isValid(entity: Entity): boolean {
            const energy = entity.getEcsComponent(EnergyComponentId);
            if (!energy) return false;
            return (
                energyFraction(energy) < SLEEP_THRESHOLD_FRACTION ||
                energy.exhaustionLevel > 0
            );
        },

        utility(entity: Entity): number {
            const energy = entity.getEcsComponent(EnergyComponentId);
            if (!energy) return 0;

            // Below the threshold, urgency ramps linearly with how far into the
            // reserve the worker has dug, reaching its peak at empty.
            let base = 0;
            const fraction = energyFraction(energy);
            if (fraction < SLEEP_THRESHOLD_FRACTION) {
                const deficit =
                    (SLEEP_THRESHOLD_FRACTION - fraction) /
                    SLEEP_THRESHOLD_FRACTION;
                base = SLEEP_UTILITY_BASE + deficit * SLEEP_UTILITY_RANGE;
            }

            // Exhaustion boost pushes priority higher as condition worsens
            const exhaustionBoost =
                [0, 10, 20, 40, 48][energy.exhaustionLevel] ?? 48;
            return Math.min(98, base + exhaustionBoost);
        },

        expand(entity: Entity): BehaviorActionData[] {
            const energy = entity.getEcsComponent(EnergyComponentId);
            if (!energy) return [];

            // Level 4: collapse in place immediately, no movement
            if (energy.exhaustionLevel >= 4) {
                return [makeSleepAction("collapse", energy)];
            }

            const root = entity.getRootEntity();

            // Check for assigned house. The worker walks adjacent, then steps
            // onto the house tile to sleep "inside" rather than blocking a tile
            // beside it.
            const houseEntity = findAssignedHouse(root, entity.id);
            if (houseEntity) {
                return [
                    {
                        type: "moveTo",
                        target: houseEntity.worldPosition,
                        stopAdjacent: "cardinal",
                    },
                    { type: "stepOnto", targetId: houseEntity.id },
                    makeSleepAction("house", energy),
                ];
            }

            // Check for bedroll in inventory
            const hasBedroll = entityHasBedroll(entity);
            if (hasBedroll) {
                // Look for a nearby campfire
                const campfire = findNearbyCampfire(
                    root,
                    entity,
                    CAMPFIRE_SEARCH_RADIUS,
                );
                if (campfire) {
                    const adjacentTile = findAdjacentWalkable(
                        root,
                        entity,
                        campfire.worldPosition,
                    );
                    const target = adjacentTile ?? campfire.worldPosition;
                    return [
                        { type: "moveTo", target, stopAdjacent: "cardinal" },
                        makeSleepAction("bedrollFire", energy),
                    ];
                }
                return [makeSleepAction("bedrollAlone", energy)];
            }

            // Fallback: sleep in place
            return [makeSleepAction("bedrollAlone", energy)];
        },
    };
}

/**
 * Build the sleep action for a quality, sized against the sleeper's own pool.
 * Takes the component rather than the entity because only expand() decides that
 * an entity can sleep at all, and it has already resolved the component.
 */
function makeSleepAction(
    quality: SleepQuality,
    energy: EnergyComponent,
): BehaviorActionData {
    return {
        type: "sleep",
        quality,
        energyPerTick: resolveSleepEnergyPerTick(
            quality,
            energy.maxEnergy,
            energy.sleepMultiplier,
        ),
        energyTarget: resolveSleepEnergyTarget(quality, energy.maxEnergy),
    };
}

function findAssignedHouse(root: Entity, entityId: string): Entity | null {
    const houses = root.queryComponents(HousingComponentId);
    for (const [houseEntity, housing] of houses) {
        if (housing.tenant === entityId) {
            return houseEntity;
        }
    }
    return null;
}

function entityHasBedroll(entity: Entity): boolean {
    const inventory = entity.getEcsComponent(InventoryComponentId);
    if (!inventory) return false;
    return inventory.items.some((stack) => stack.item.id === "bedroll");
}

function findNearbyCampfire(
    root: Entity,
    entity: Entity,
    radius: number,
): Entity | null {
    const chunkMapComp = root.getEcsComponent(ChunkMapComponentId);
    if (!chunkMapComp) return null;

    const pos = entity.worldPosition;
    const bounds = {
        x1: pos.x - radius,
        y1: pos.y - radius,
        x2: pos.x + radius,
        y2: pos.y + radius,
    };

    const nearby = getEntitiesInChunkMapWithin(chunkMapComp.chunkMap, bounds);
    for (const candidate of nearby) {
        const fireSource = candidate.getEcsComponent(FireSourceComponentId);
        if (!fireSource?.isActive) continue;
        const building = candidate.getEcsComponent(BuildingComponentId);
        if (building?.scaffolded) continue;
        const dx = candidate.worldPosition.x - pos.x;
        const dy = candidate.worldPosition.y - pos.y;
        if (Math.abs(dx) <= radius && Math.abs(dy) <= radius) {
            return candidate;
        }
    }
    return null;
}

function findAdjacentWalkable(
    root: Entity,
    _entity: Entity,
    target: Point,
): Point | null {
    const cardinalOffsets: Point[] = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
    ];

    for (const offset of cardinalOffsets) {
        const candidate = { x: target.x + offset.x, y: target.y + offset.y };
        if (isTileAvailable(candidate, root)) {
            return candidate;
        }
    }
    return null;
}
