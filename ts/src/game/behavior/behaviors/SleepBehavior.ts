import type { Entity } from "../../entity/entity.ts";
import { EnergyComponentId } from "../../component/energyComponent.ts";
import { HousingComponentId } from "../../component/housingComponent.ts";
import { FireSourceComponentId } from "../../component/fireSourceComponent.ts";
import {
    ChunkMapComponentId,
    getEntitiesInChunkMapWithin,
} from "../../component/chunkMapComponent.ts";
import { getPathfindingGraphForEntity } from "../../map/path/getPathfindingGraphForEntity.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import type { SleepQuality } from "../actions/Action.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";
import { sleepParamsByQuality } from "../actions/sleepAction.ts";
import type { Point } from "../../../common/point.ts";

const CAMPFIRE_SEARCH_RADIUS = 20;

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
            return energy.energy < 30 || energy.exhaustionLevel > 0;
        },

        utility(entity: Entity): number {
            const energy = entity.getEcsComponent(EnergyComponentId);
            if (!energy) return 0;

            // Base from energy: when energy < 30, scales from 55 to 75
            let base = 0;
            if (energy.energy < 30) {
                base = 55 + (30 - energy.energy) * 0.67;
            }

            // Exhaustion boost pushes priority higher as condition worsens
            const exhaustionBoost = [0, 10, 20, 40, 48][energy.exhaustionLevel] ?? 48;
            return Math.min(98, base + exhaustionBoost);
        },

        expand(entity: Entity): BehaviorActionData[] {
            const energy = entity.getEcsComponent(EnergyComponentId);
            if (!energy) return [];

            // Level 4: collapse in place immediately, no movement
            if (energy.exhaustionLevel >= 4) {
                return [makeSleepAction("collapse", entity)];
            }

            const root = entity.getRootEntity();

            // Check for assigned house
            const houseEntity = findAssignedHouse(root, entity.id);
            if (houseEntity) {
                const adjacentTile = findAdjacentWalkable(
                    root,
                    entity,
                    houseEntity.worldPosition,
                );
                if (adjacentTile) {
                    // Walk directly to the pre-computed adjacent tile — no stopAdjacent,
                    // otherwise the entity stops one tile short of it.
                    return [
                        { type: "moveTo", target: adjacentTile },
                        makeSleepAction("house", entity),
                    ];
                }
                return [
                    {
                        type: "moveTo",
                        target: houseEntity.worldPosition,
                        stopAdjacent: "cardinal",
                    },
                    makeSleepAction("house", entity),
                ];
            }

            // Check for bedroll in inventory
            const hasBedroll = entityHasBedroll(entity);
            if (hasBedroll) {
                // Look for a nearby campfire
                const campfire = findNearbyCampfire(root, entity, CAMPFIRE_SEARCH_RADIUS);
                if (campfire) {
                    const adjacentTile = findAdjacentWalkable(
                        root,
                        entity,
                        campfire.worldPosition,
                    );
                    const target = adjacentTile ?? campfire.worldPosition;
                    return [
                        { type: "moveTo", target, stopAdjacent: "cardinal" },
                        makeSleepAction("bedrollFire", entity),
                    ];
                }
                return [makeSleepAction("bedrollAlone", entity)];
            }

            // Fallback: sleep in place
            return [makeSleepAction("bedrollAlone", entity)];
        },
    };
}

function makeSleepAction(
    quality: SleepQuality,
    entity: Entity,
): BehaviorActionData {
    const params = sleepParamsByQuality[quality];
    const energy = entity.getEcsComponent(EnergyComponentId);
    const maxEnergy = energy?.maxEnergy ?? 100;
    const sleepMultiplier = energy?.sleepMultiplier ?? 1.0;
    return {
        type: "sleep",
        quality,
        energyPerTick: params.energyPerTick / sleepMultiplier,
        energyTarget: Math.floor(maxEnergy * params.energyRestoreFraction),
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
    entity: Entity,
    target: Point,
): Point | null {
    const pathfindingGraph = getPathfindingGraphForEntity(root, entity);
    if (!pathfindingGraph) return null;

    const { graph } = pathfindingGraph;
    const cardinalOffsets: Point[] = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
    ];

    for (const offset of cardinalOffsets) {
        const candidate = { x: target.x + offset.x, y: target.y + offset.y };
        const node = graph.nodeAt(candidate.x, candidate.y);
        if (node && !node.isWall) {
            return candidate;
        }
    }
    return null;
}
