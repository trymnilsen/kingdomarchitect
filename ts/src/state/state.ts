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

export interface Chunk {
    x: number;
    y: number;
    tiles: TileType[];
    volumes: number[];
    blocks: number[];
}

export function getChunks(): Chunk[] {
    const chunks: Chunk[] = [];

    for (let c = 0; c < TOTALCHUNKS; c++) {
        const tiles: TileType[] = [];
        const volumes: number[] = [];
        const blocks: number[] = [];
        const chunkVolumeId = incrementAndGetVolumeId();
        for (let i = 0; i < TOTALTILES; i++) {
            tiles.push(TileType.Grass);
            volumes.push(chunkVolumeId);
            blocks.push(0);
        }
        const chunkX = getChunkX(c);
        const chunkY = getChunkY(c);
        chunks.push({
            x: chunkX,
            y: chunkY,
            tiles,
            volumes,
            blocks
        });
    }
    return chunks;
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

export interface Volume {
    tiles: VolumeStatus[];
}
