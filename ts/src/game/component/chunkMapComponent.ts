import type { Bounds } from "../../common/bounds.ts";
import { encodePosition, type Point } from "../../common/point.ts";
import { SparseSet } from "../../common/structure/sparseSet.ts";
import { ChunkSize } from "../map/chunk.ts";
import type { Entity } from "../entity/entity.ts";

type TileCells = (Entity[] | undefined)[];

export type ChunkMap = {
    chunks: Map<number, SparseSet<Entity>>;
    tiles: Map<number, TileCells>;
};

export type ChunkMapComponent = {
    id: typeof ChunkMapComponentId;
    chunkMap: ChunkMap;
};

export const ChunkMapComponentId = "ChunkMap";

export function createChunkMapComponent(): ChunkMapComponent {
    return {
        id: ChunkMapComponentId,
        chunkMap: createChunkMap(),
    };
}

export function createChunkMap(): ChunkMap {
    return {
        chunks: new Map(),
        tiles: new Map(),
    };
}

export function indexEntity(chunkMap: ChunkMap, entity: Entity) {
    const { x, y } = entity.worldPosition;
    const chunkKey = chunkKeyAt(x, y);
    const chunk = getOrCreateChunk(chunkMap, chunkKey);
    if (chunk.contains(entity)) {
        return;
    }
    chunk.add(entity);
    addToCell(cellsFor(chunkMap, chunkKey), cellIndex(x, y), entity);
}

export function unindexEntity(chunkMap: ChunkMap, entity: Entity) {
    const { x, y } = entity.worldPosition;
    const chunkKey = chunkKeyAt(x, y);
    removeFromCell(chunkMap.tiles.get(chunkKey), cellIndex(x, y), entity);
    chunkMap.chunks.get(chunkKey)?.delete(entity);
}

export function moveIndexedEntity(
    chunkMap: ChunkMap,
    entity: Entity,
    fromX: number,
    fromY: number,
) {
    const { x, y } = entity.worldPosition;
    if (x === fromX && y === fromY) {
        return;
    }

    const fromChunkKey = chunkKeyAt(fromX, fromY);
    const toChunkKey = chunkKeyAt(x, y);
    const fromCells = chunkMap.tiles.get(fromChunkKey);
    removeFromCell(fromCells, cellIndex(fromX, fromY), entity);

    if (fromChunkKey === toChunkKey) {
        addToCell(
            fromCells ?? cellsFor(chunkMap, toChunkKey),
            cellIndex(x, y),
            entity,
        );
        return;
    }
    chunkMap.chunks.get(fromChunkKey)?.delete(entity);
    getOrCreateChunk(chunkMap, toChunkKey).add(entity);
    addToCell(cellsFor(chunkMap, toChunkKey), cellIndex(x, y), entity);
}

export function getEntitiesAt(
    chunkMap: ChunkMap,
    x: number,
    y: number,
): Entity[] {
    const cell = cellAt(chunkMap, x, y);
    // copy so callers can remove entities while iterating
    return cell ? cell.slice() : [];
}

export function collectEntitiesInRow(
    chunkMap: ChunkMap,
    y: number,
    x1: number,
    x2: number,
    out: Entity[],
) {
    const chunkY = Math.floor(y / ChunkSize);
    const rowOffset = (y - chunkY * ChunkSize) * ChunkSize;
    let x = x1;
    while (x <= x2) {
        const chunkX = Math.floor(x / ChunkSize);
        const chunkEnd = Math.min(x2, (chunkX + 1) * ChunkSize - 1);
        const cells = chunkMap.tiles.get(encodePosition(chunkX, chunkY));
        if (cells) {
            for (let tileX = x; tileX <= chunkEnd; tileX++) {
                const cell = cells[rowOffset + tileX - chunkX * ChunkSize];
                if (!cell) {
                    continue;
                }
                for (let i = 0; i < cell.length; i++) {
                    out.push(cell[i]);
                }
            }
        }
        x = chunkEnd + 1;
    }
}

export function getEntitiesInChunkMapWithin(
    chunkMap: ChunkMap,
    bounds: Bounds,
): Entity[] {
    const startChunkX = Math.floor(bounds.x1 / ChunkSize);
    const startChunkY = Math.floor(bounds.y1 / ChunkSize);
    const endChunkX = Math.floor(bounds.x2 / ChunkSize) + 1;
    const endChunkY = Math.floor(bounds.y2 / ChunkSize) + 1;
    const xChunks = endChunkX - startChunkX;
    const yChunks = endChunkY - startChunkY;

    const entities: Entity[] = [];
    const totalChunks = xChunks * yChunks;

    for (let i = 0; i < totalChunks; i++) {
        // Convert the linear index `i` to chunk coordinates
        const chunkX = startChunkX + (i % xChunks);
        const chunkY = startChunkY + Math.floor(i / xChunks);
        const chunkKey = encodePosition(chunkX, chunkY);

        const chunk = chunkMap.chunks.get(chunkKey);
        if (!chunk || chunk.size === 0) continue;

        // Collect entities
        entities.push(...chunk.dense);
    }

    return entities;
}

export function getEntitiesInChunk(
    chunkMap: ChunkMap,
    chunkPosition: Point,
): Entity[] {
    const chunkKey = encodePosition(chunkPosition.x, chunkPosition.y);
    const chunk = chunkMap.chunks.get(chunkKey);
    if (!!chunk) {
        return chunk.dense;
    } else {
        return [];
    }
}

function chunkKeyAt(x: number, y: number): number {
    return encodePosition(Math.floor(x / ChunkSize), Math.floor(y / ChunkSize));
}

function cellIndex(x: number, y: number): number {
    const localX = x - Math.floor(x / ChunkSize) * ChunkSize;
    const localY = y - Math.floor(y / ChunkSize) * ChunkSize;
    return localY * ChunkSize + localX;
}

function cellAt(
    chunkMap: ChunkMap,
    x: number,
    y: number,
): Entity[] | undefined {
    return chunkMap.tiles.get(chunkKeyAt(x, y))?.[cellIndex(x, y)];
}

function cellsFor(chunkMap: ChunkMap, chunkKey: number): TileCells {
    let cells = chunkMap.tiles.get(chunkKey);
    if (!cells) {
        cells = new Array(ChunkSize * ChunkSize);
        chunkMap.tiles.set(chunkKey, cells);
    }
    return cells;
}

function addToCell(cells: TileCells, index: number, entity: Entity) {
    const cell = cells[index];
    if (cell) {
        cell.push(entity);
    } else {
        cells[index] = [entity];
    }
}

function removeFromCell(
    cells: TileCells | undefined,
    index: number,
    entity: Entity,
) {
    const cell = cells?.[index];
    if (!cell) {
        return;
    }
    const position = cell.indexOf(entity);
    if (position >= 0) {
        cell[position] = cell[cell.length - 1];
        cell.pop();
    }
}

function getOrCreateChunk(
    chunkMap: ChunkMap,
    chunkKey: number,
): SparseSet<Entity> {
    const chunk = chunkMap.chunks.get(chunkKey);
    if (chunk) {
        return chunk;
    }
    const set = new SparseSet<Entity>();
    chunkMap.chunks.set(chunkKey, set);
    return set;
}
