import { Point } from "../../data/point";
import { TILES_PER_CHUNK, TOTAL_TILES } from "../constants";
import {
    GameState,
    getAdjacentTilePosition,
    getAllAdjacentTilePositions,
    getChunkId,
    getTileOffset,
    getTileType,
    TilePosition,
} from "./gameState";

export function toggleWall(state: GameState, point: Point): GameState {
    const chunkX = Math.floor(point.x / TILES_PER_CHUNK);
    const chunkY = Math.floor(point.y / TILES_PER_CHUNK);
    const chunkId = getChunkId({ x: chunkX, y: chunkY });
    const chunk = state.chunks[chunkId];
    if (chunk) {
        const tileX = point.x % TILES_PER_CHUNK;
        const tileY = point.y % TILES_PER_CHUNK;
        const tileOffset = getTileOffset({ x: tileX, y: tileY });
        const currentTileType = chunk.tileMap[tileOffset];
        if (currentTileType === 1) {
            chunk.tileMap[tileOffset] = 0;
            updateRooms(
                state,
                {
                    chunkX,
                    chunkY,
                    tileX,
                    tileY,
                },
                false
            );
        } else {
            chunk.tileMap[tileOffset] = 1;
            updateRooms(
                state,
                {
                    chunkX,
                    chunkY,
                    tileX,
                    tileY,
                },
                true
            );
        }
    } else {
        console.log(`Chunk not found: ${chunkId}`);
    }
    return state;
}

export function updateRooms(
    state: GameState,
    position: TilePosition,
    added: boolean
): GameState {
    const start = performance.now();
    let initialPoints: TilePosition[] = [];
    // If the wall has been added, we search using the adjacent tiles..
    // Otherwise we search using the tile that was removed
    if (added) {
        initialPoints = getAllAdjacentTilePositions(position);
    } else {
        initialPoints = [position];
    }
    initialPoints = initialPoints.filter(
        (point) => getTileType(state, point) === 0
    );
    console.log("Searching with: ", initialPoints);
    const RoomSearchResult = roomSearchWithTiles(state, initialPoints);
    

    const stop = performance.now();
    console.log("Search result: ", RoomSearchResult);
    console.log("Time: ", stop - start);
    // If a room is opened up causing it to be too large we se all tiles in the
    // room that became too large. This way we don't end up with a areas that
    // have different room values because we did not search all of it
    return state;
}

export interface RoomSearchResult {
    rooms: Room[];
}

export interface Room {
    tiles: TilePosition[];
}

export function roomSearchWithTiles(
    state: GameState,
    tiles: TilePosition[]
): RoomSearchResult {
    const rooms: Room[] = [];
    
    const visitedTiles: { [id: string]: boolean } = {};
    tiles.forEach((initalTile) => {
        const roomTiles: TilePosition[] = [];
        const searchTargets: TilePosition[] = [initalTile];
        let searches = 0;
        while (searchTargets.length > 0) {
            const searchPosition = searchTargets.shift();
            //console.log("current position", searchPosition);
            const visittedTileId = visitedTileId(searchPosition);
            searches += 1;
            if (visitedTiles[visittedTileId] == true) {
                //console.log("Tile was already visited: ", visittedTileId);
                continue;
            }
            // Get the type from the tileposition
            const tileType = getTileType(state, searchPosition);
            // add this current search position to visited tiles
            visitedTiles[visittedTileId] = true;
            // if the tile is valid add it to room tiles
            if (tileType != null && tileType === 0) {
                roomTiles.push(searchPosition);
                const adjacentTiles = getAllAdjacentTilePositions(
                    searchPosition
                );
                adjacentTiles.forEach((adjacentTile) => {
                    /*                     console.log(
                        `Adding adjacent to ${visittedTileId}`,
                        adjacentTile
                    ); */
                    const adjacentTileId = visitedTileId(adjacentTile);
                    const adjacentTileType = getTileType(state, adjacentTile);
                    if (
                        adjacentTileType != null &&
                        adjacentTileType === 0 &&
                        visitedTiles[adjacentTileId] !== true
                    ) {
                        searchTargets.push(adjacentTile);
                    }
                });
            } else {
                console.log("Tile was not valid", searchPosition);
            }
        }
        console.log(`Searches ${searches}`);
        if (roomTiles.length > 0) {
            rooms.push({
                tiles: roomTiles,
            });
        }
        //console.log(`Room from ${initalTile}: `, roomTiles);
    });
    return {
        rooms: rooms,
    };
}

function visitedTileId(tile: TilePosition): string {
    return `cx${tile.chunkX}cy${tile.chunkY}tx${tile.tileX}ty${tile.tileY}`;
}

let nextRoomId = 1;
export function getNextRoomId() {
    nextRoomId = nextRoomId + 1;
    return nextRoomId;
}
