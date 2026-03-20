import { adjacentPoints, type Point } from "../../../common/point.ts";
import {
    getChunk,
    TileComponentId,
} from "../../component/tileComponent.ts";
import { KingdomComponentId } from "../../component/kingdomComponent.ts";
import { Entity } from "../../entity/entity.ts";
import { ChunkSize } from "../chunk.ts";
import { getTileId } from "../tile.ts";
import { KingdomSpawnConfig } from "./kingdomSpawnConfig.ts";

/**
 * Builds a map of territorial influence keyed by volume id.
 *
 * BFS traverses registered chunks outward from each kingdom's position.
 * Influence is uniform within a volume — it only decays when the BFS
 * crosses into a new volume (one volume boundary = one decay step).
 *
 * Two visited sets keep the traversal correct:
 * - visitedChunks: prevents re-queuing the same chunk from multiple
 *   neighbours, keeping the BFS from exploding inside large volumes.
 * - visitedVolumes: once a volume is reached via the shortest path,
 *   longer paths to the same volume are ignored. This is what makes
 *   FIFO ordering load-bearing — the first dequeue of any volume is
 *   always the highest-influence one.
 *
 * Volumes from different kingdoms accumulate — the map stores the
 * sum of all kingdoms' contributions to each volume.
 */
export function buildInfluenceMap(root: Entity): Map<string, number> {
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const kingdoms = root.queryComponents(KingdomComponentId);
    const influenceMap = new Map<string, number>();

    for (const [kingdomEntity, kingdom] of kingdoms) {
        const worldPos = kingdomEntity.worldPosition;
        const kingdomChunkPos: Point = {
            x: Math.floor(worldPos.x / ChunkSize),
            y: Math.floor(worldPos.y / ChunkSize),
        };

        const startChunk = getChunk(tileComponent, kingdomChunkPos);
        if (!startChunk?.volume) {
            // Kingdom is not sitting on a registered chunk — skip it.
            // This can happen if the kingdom is placed before the map generates.
            continue;
        }

        const strength =
            KingdomSpawnConfig.influence.strength[
                kingdom.type as keyof typeof KingdomSpawnConfig.influence.strength
            ];
        const decayRate = KingdomSpawnConfig.influence.decayRate;
        const cutoffThreshold = KingdomSpawnConfig.influence.cutoffThreshold;

        // Per-kingdom visited sets so kingdoms do not interfere with each
        // other's BFS paths. Contributions are summed into influenceMap after.
        const visitedChunks = new Set<string>();
        const visitedVolumes = new Set<string>();
        const queue: Array<{ pos: Point; influence: number }> = [];

        const startTileId = getTileId(kingdomChunkPos.x, kingdomChunkPos.y);
        visitedChunks.add(startTileId);
        queue.push({ pos: kingdomChunkPos, influence: strength });

        while (queue.length > 0) {
            const { pos, influence } = queue.shift()!;

            const chunk = getChunk(tileComponent, pos);
            if (!chunk?.volume) {
                continue;
            }

            const volume = chunk.volume;

            // Record this volume's influence the first time we enter it.
            // Because BFS is FIFO, the first entry is always via the
            // shortest chunk-path, so the influence value is the highest
            // it will ever be for this kingdom.
            if (!visitedVolumes.has(volume.id)) {
                influenceMap.set(
                    volume.id,
                    (influenceMap.get(volume.id) ?? 0) + influence,
                );
                visitedVolumes.add(volume.id);
            }

            // Influence that would cross into the next volume
            const decayedInfluence = influence * (1 - decayRate);

            for (const neighbor of adjacentPoints(pos)) {
                const neighborTileId = getTileId(neighbor.x, neighbor.y);
                if (visitedChunks.has(neighborTileId)) {
                    continue;
                }

                const neighborChunk = getChunk(tileComponent, neighbor);
                if (!neighborChunk?.volume) {
                    // Unregistered chunk — influence cannot cross gaps
                    continue;
                }

                const neighborVolume = neighborChunk.volume;

                if (neighborVolume.id === volume.id) {
                    // Same volume: no boundary crossing, no decay.
                    // Keep exploring the interior at the same influence level.
                    visitedChunks.add(neighborTileId);
                    queue.push({ pos: neighbor, influence });
                } else {
                    // Different volume: this is a boundary crossing.
                    // Skip if already reached via a shorter path, or if the
                    // decayed value has fallen below the pruning threshold.
                    if (visitedVolumes.has(neighborVolume.id)) {
                        continue;
                    }
                    if (decayedInfluence < cutoffThreshold) {
                        continue;
                    }
                    visitedChunks.add(neighborTileId);
                    queue.push({ pos: neighbor, influence: decayedInfluence });
                }
            }
        }
    }

    return influenceMap;
}

/**
 * Returns the total territorial influence at the volume containing the given
 * chunk position, summed across all kingdoms in the world.
 *
 * Returns 0 if the chunk is not registered or has no associated volume.
 */
export function computeInfluenceAtChunk(
    root: Entity,
    candidateChunkPosition: Point,
): number {
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const chunk = getChunk(tileComponent, candidateChunkPosition);
    if (!chunk?.volume) {
        return 0;
    }

    const influenceMap = buildInfluenceMap(root);
    return influenceMap.get(chunk.volume.id) ?? 0;
}
