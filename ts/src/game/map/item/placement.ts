import { encodePosition, type Point } from "../../../common/point.ts";
import {
    type ChunkMap,
    getEntitiesInChunkMapWithin,
} from "../../component/chunkMapComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Find a random valid spawn point within a diamond pattern around a center point.
 * Diamond pattern: tiles where |dx| + |dy| <= radius
 */
export function findRandomSpawnInDiamond(
    center: Point,
    radius: number,
    chunkMap: ChunkMap,
): Point | null {
    // Get all tiles in diamond pattern
    const candidates: Point[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (Math.abs(dx) + Math.abs(dy) <= radius) {
                // Skip the center tile (where the building is)
                if (dx === 0 && dy === 0) continue;
                candidates.push({ x: center.x + dx, y: center.y + dy });
            }
        }
    }

    if (candidates.length === 0) {
        return null;
    }

    // Build set of occupied positions from existing entities
    const bounds = {
        x1: center.x - radius,
        y1: center.y - radius,
        x2: center.x + radius,
        y2: center.y + radius,
    };
    const existing = getEntitiesInChunkMapWithin(chunkMap, bounds);
    const occupied = new Set<number>();
    for (const entity of existing) {
        occupied.add(
            encodePosition(entity.worldPosition.x, entity.worldPosition.y),
        );
    }

    // Filter to unoccupied candidates
    const valid = candidates.filter(
        (p) => !occupied.has(encodePosition(p.x, p.y)),
    );

    if (valid.length === 0) {
        return null;
    }

    // Pick random from valid positions
    return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * Find all resource entities of a given resourceId within a diamond pattern
 * around a center point (excluding the center tile, where the building sits).
 * Used by the forester to count and randomly pick trees in its zone.
 */
export function getResourcesInDiamond(
    center: Point,
    radius: number,
    chunkMap: ChunkMap,
    resourceId: string,
): Entity[] {
    const bounds = {
        x1: center.x - radius,
        y1: center.y - radius,
        x2: center.x + radius,
        y2: center.y + radius,
    };
    const existing = getEntitiesInChunkMapWithin(chunkMap, bounds);
    return existing.filter((entity) => {
        const dx = entity.worldPosition.x - center.x;
        const dy = entity.worldPosition.y - center.y;
        if (Math.abs(dx) + Math.abs(dy) > radius) return false;
        if (dx === 0 && dy === 0) return false;
        const resource = entity.getEcsComponent(ResourceComponentId);
        return resource?.resourceId === resourceId;
    });
}

/**
 * Get all points in a diamond pattern around a center
 */
export function getDiamondPoints(center: Point, radius: number): Point[] {
    const points: Point[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (Math.abs(dx) + Math.abs(dy) <= radius) {
                points.push({ x: center.x + dx, y: center.y + dy });
            }
        }
    }
    return points;
}
