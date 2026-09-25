import { pondShapes } from "../../../../generated/pondShapes.ts";
import { shuffleItems } from "../../../common/array.ts";
import type { Point } from "../../../common/point.ts";
import { biomes, type BiomeType, type PondGeneration } from "../biome.ts";
import {
    ChunkSize,
    maskTerrain,
    paintTerrain,
    type TileChunk,
} from "../chunk.ts";
import { Terrain } from "../terrain.ts";
import {
    createEmptyMask,
    masksOverlap,
    orientMask,
    stampMask,
    type TileMask,
} from "../tileMask.ts";

export const chunkFittingPondShapes: readonly TileMask[] = pondShapes.filter(
    (shape) => shape.width <= ChunkSize && shape.height <= ChunkSize,
);

export const PondRollsPerChunk = 4;

export function placeBiomePonds(
    biome: BiomeType,
    chunk: TileChunk,
    random: () => number,
): void {
    const generation: PondGeneration | null = biomes[biome].ponds;
    if (!generation) {
        return;
    }

    let occupied = maskTerrain(chunk, (terrain) => terrain !== Terrain.Land);
    let ponds = createEmptyMask(ChunkSize, ChunkSize);
    for (let roll = 0; roll < PondRollsPerChunk; roll++) {
        const placed = placePonds(
            occupied,
            generation,
            chunkFittingPondShapes,
            random,
        );
        ponds = stampMask(ponds, placed, 0, 0);
        occupied = stampMask(occupied, placed, 0, 0);
    }
    chunk.terrain = paintTerrain(chunk.terrain, ponds, generation.terrain);
}

export function placePonds(
    blocked: TileMask,
    generation: PondGeneration,
    shapes: readonly TileMask[],
    random: () => number,
): TileMask {
    let ponds = createEmptyMask(blocked.width, blocked.height);
    if (random() >= generation.chance) {
        return ponds;
    }

    const candidates = shapes.filter(
        (shape) => Math.max(shape.width, shape.height) <= generation.maxSize,
    );
    if (candidates.length === 0) {
        return ponds;
    }

    const count = 1 + Math.floor(random() * generation.maxCount);
    let occupied = blocked;
    for (let pond = 0; pond < count; pond++) {
        const shape = candidates[Math.floor(random() * candidates.length)];
        const oriented = orientMask(
            shape,
            Math.floor(random() * 4),
            random() < 0.5,
        );
        const offset = findFreeOffset(occupied, oriented, random);
        if (offset) {
            ponds = stampMask(ponds, oriented, offset.x, offset.y);
            occupied = stampMask(occupied, oriented, offset.x, offset.y);
        }
    }

    return ponds;
}

function findFreeOffset(
    occupied: TileMask,
    shape: TileMask,
    random: () => number,
): Point | null {
    const offsets: Point[] = [];
    for (let y = 0; y <= occupied.height - shape.height; y++) {
        for (let x = 0; x <= occupied.width - shape.width; x++) {
            offsets.push({ x, y });
        }
    }

    for (const offset of shuffleItems(offsets, random)) {
        if (!masksOverlap(occupied, shape, offset.x, offset.y)) {
            return offset;
        }
    }
    return null;
}
