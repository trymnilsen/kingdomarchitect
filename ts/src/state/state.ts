export const NUMBEROFCHUNKS = 4;
export const NUMBEROFTILES = 8;
export const TILESIZE = 64;

export const TOTALCHUNKS = NUMBEROFCHUNKS * NUMBEROFCHUNKS;
export const TOTALTILES = NUMBEROFTILES * NUMBEROFTILES;
export const NUMBEROFTILESMINUSONE = NUMBEROFTILES - 1;
export const TOTALTILESMINUSONE = TOTALTILES - 1;
export const CHUNKSIZE = TILESIZE * NUMBEROFTILES;

export enum TileType {
    Grass = 1,
    Water = 2,
    Dirt = 3
}

export enum VolumeStatus {
    Available = 1,
    Unavailable = 2
}

export type VolumeConnectionMap = { [from: number]: number[] };

export interface Chunk {
    x: number;
    y: number;
    tiles: TileType[];
    volumes: number[];
    blocks: number[];
    connectedVolumes: VolumeConnectionMap;
}
export interface Room {
    size: number;
    volumes: number[];
    chunks: number[];
}

export interface Volume {
    size: number;
    id: number;
    chunk: number;
    room: number;
}

export interface WorldMap {
    chunks: Chunk[];
    volumes: { [id: string]: Volume };
    rooms: { [id: string]: Room };
}

export function getWorldMap(): WorldMap {
    const chunks: Chunk[] = [];
    const volumeMap: { [id: string]: Volume } = {};

    for (let c = 0; c < TOTALCHUNKS; c++) {
        const tiles: TileType[] = [];
        const volumes: number[] = [];
        const blocks: number[] = [];
        const chunkVolumeId = incrementAndGetVolumeId();
        volumeMap[chunkVolumeId] = {
            room: 1,
            size: TOTALTILES,
            chunk: c,
            id: chunkVolumeId
        };
        for (let i = 0; i < TOTALTILES; i++) {
            tiles.push(TileType.Grass);
            volumes.push(chunkVolumeId);
            blocks.push(0);
        }
        const chunkX = getChunkX(c);
        const chunkY = getChunkY(c);
        //The volumeid for a clean state is the same as the chunk id
        const connectedVolumes: VolumeConnectionMap = {};
        const leftChunk = getChunkId(chunkX - 1, chunkY);
        const rightChunk = getChunkId(chunkX + 1, chunkY);
        const topChunk = getChunkId(chunkX, chunkY - 1);
        const bottomChunk = getChunkId(chunkX, chunkY + 1);
        if (leftChunk >= 0) {
            pushIntoKey(connectedVolumes, leftChunk, chunkVolumeId);
        }
        if (rightChunk >= 0) {
            pushIntoKey(connectedVolumes, rightChunk, chunkVolumeId);
        }
        if (topChunk >= 0) {
            pushIntoKey(connectedVolumes, topChunk, chunkVolumeId);
        }
        if (bottomChunk >= 0) {
            pushIntoKey(connectedVolumes, bottomChunk, chunkVolumeId);
        }
        chunks.push({
            x: chunkX,
            y: chunkY,
            connectedVolumes: connectedVolumes,
            tiles,
            volumes,
            blocks
        });
    }

    const rooms: { [id: string]: Room } = {
        "1": {
            size: TOTALCHUNKS * TOTALTILES,
            volumes: Object.keys(volumeMap).map((volume) =>
                Number.parseInt(volume)
            ),
            chunks: chunks.map((chunk, index) => index)
        }
    };

    return {
        volumes: volumeMap,
        chunks,
        rooms
    };
}

function pushIntoKey(
    map: { [id: number]: number[] },
    value: number,
    key: number
) {
    if (map[key] === undefined) {
        map[key] = [];
    }
    map[key].push(value);
}

export function getTileIndex(tileX: number, tileY: number): number {
    return tileY * NUMBEROFTILES + tileX;
}

export function getChunkId(chunkX: number, chunkY: number): number {
    if (
        chunkX >= 0 &&
        chunkX < NUMBEROFCHUNKS &&
        chunkY >= 0 &&
        chunkY < NUMBEROFCHUNKS
    ) {
        return chunkY * NUMBEROFCHUNKS + chunkX;
    } else {
        return -1;
    }
}

export function getChunkX(chunkIndex: number): number {
    return chunkIndex % NUMBEROFCHUNKS;
}
export function getChunkY(chunkIndex: number): number {
    return Math.floor(chunkIndex / NUMBEROFCHUNKS);
}

let volumeId: number = 0;
export function incrementAndGetVolumeId(): number {
    return volumeId++;
}

let roomId: number = 2;
export function incrementAndGetRoomId(): number {
    return roomId++;
}
