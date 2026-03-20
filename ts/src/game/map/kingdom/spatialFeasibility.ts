import { adjacentPoints, type Point } from "../../../common/point.ts";
import {
    hasChunk,
    TileComponentId,
} from "../../component/tileComponent.ts";
import { Entity } from "../../entity/entity.ts";
import { getTileId } from "../tile.ts";
import { KingdomSpawnConfig } from "./kingdomSpawnConfig.ts";

export type SpatialFeasibilityResult = {
    availableChunks: number;
    targetChunks: number;
    feasible: boolean;
};

/**
 * Checks how much unregistered (undiscovered) space is available around
 * the candidate chunk position for a kingdom to grow into.
 *
 * Registered chunks act as walls — the flood fill only traverses
 * unregistered positions. This mirrors how world generation works: newly
 * placed kingdoms expand into chunks that haven't been discovered yet.
 *
 * The BFS stops early once it has counted enough chunks, so the cost is
 * proportional to the target rather than the size of the open region.
 * We stop at max(targetChunks, minimumVolumeSize) so that we always
 * gather enough information to determine feasibility even when the
 * requested target is smaller than the minimum viable kingdom size.
 */
export function checkSpatialFeasibility(
    root: Entity,
    candidateChunkPosition: Point,
    targetChunks: number,
): SpatialFeasibilityResult {
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const visited = new Set<string>();
    const queue: Point[] = [];

    // The candidate itself is a registered chunk (the kingdom would sit there),
    // so mark it visited without counting it as available space.
    visited.add(
        getTileId(candidateChunkPosition.x, candidateChunkPosition.y),
    );

    for (const neighbor of adjacentPoints(candidateChunkPosition)) {
        const neighborTileId = getTileId(neighbor.x, neighbor.y);
        if (!visited.has(neighborTileId)) {
            visited.add(neighborTileId);
            queue.push(neighbor);
        }
    }

    let availableChunks = 0;
    const countNeeded = Math.max(
        targetChunks,
        KingdomSpawnConfig.minimumVolumeSize,
    );

    while (queue.length > 0) {
        const position = queue.shift()!;

        if (hasChunk(tileComponent, position)) {
            // Registered chunk — treat as a wall, do not count or expand
            continue;
        }

        availableChunks++;

        // Stop early once we have confirmed enough space exists.
        // We don't need to count every reachable chunk — just enough
        // to make the feasibility decision.
        if (availableChunks >= countNeeded) {
            break;
        }

        for (const neighbor of adjacentPoints(position)) {
            const neighborTileId = getTileId(neighbor.x, neighbor.y);
            if (!visited.has(neighborTileId)) {
                visited.add(neighborTileId);
                queue.push(neighbor);
            }
        }
    }

    return {
        availableChunks,
        targetChunks,
        feasible: availableChunks >= KingdomSpawnConfig.minimumVolumeSize,
    };
}
