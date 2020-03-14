import { DataTree } from "../../../state/dataNode";
import { RenderNode, container } from "../../rendering/items/renderNode";
import { rectangle } from "../../rendering/items/rectangle";
import { rgbToHex } from "../../../util/color";
import { Point } from "../../../data/point";

/* import { RenderNode } from "../../rendering/items/renderNode";
import { RenderContext } from "../../rendering/renderContext";
import { Rectangle } from "../../rendering/items/rectangle";
import { Point } from "../../../data/point";
import { rgbToHex } from "../../../util/color";

export type ChunkMap = { [chunkId: string]: Chunk };
export class ChunkHandler {
    private chunks: ChunkMap = {};
    private container: RenderNode;
    public constructor(container: RenderNode) {
        this.container = container;
        this.buildChunks();
    }
    public render(context: RenderContext) {}

    public addChunk() {}

    private buildChunks() {
        const horizontalChunks = 1;
        const verticalChunks = 1;
        console.log("[buildChunks]", horizontalChunks, verticalChunks);
        for (let x = 0; x < horizontalChunks; x++) {
            for (let y = 0; y < verticalChunks; y++) {
                const chunkId = getChunkId(x, y);
                const chunk = new Chunk(this.container, x, y);
                chunk.x = x;
                chunk.y = y;
                this.chunks[chunkId] = chunk;
            }
        }
    }
}

export const bufferChunks = 2;
export const TilesPerChunck = 3;
export const TileSize = 64;
export const ChunkSize = TilesPerChunck * TileSize;

export class Chunk {
    public x: number;
    public y: number;
    public tiles: Tile[] = [];
    private chunkContainer: RenderNode;
    public constructor(container: RenderNode, x: number, y: number) {
        this.chunkContainer = new RenderNode();
        this.chunkContainer.position = {
            x: x * ChunkSize,
            y: y * ChunkSize
        };
        container.addChild(this.chunkContainer);

        for (let x = 0; x < TilesPerChunck; x++) {
            for (let y = 0; y < TilesPerChunck; y++) {
                const tile = new Tile(
                    this.chunkContainer,
                    { x, y },
                    getColor(x, y)
                );
            }
        }
    }
    public render(context: RenderContext) {}
}

export class Tile {
    public x: number;
    public y: number;
    public tileVisual: Rectangle;
    public constructor(container: RenderNode, position: Point, color: string) {
        this.x = position.x;
        this.y = position.y;
        this.tileVisual = new Rectangle({
            x: this.x * TileSize + 4,
            y: this.y * TileSize + 4,
            width: TileSize - 8,
            height: TileSize - 8,
            color
        });
        container.addChild(this.tileVisual);
    }
    public render(context: RenderContext) {}
}

export function getChunkId(x: number, y: number): string {
    return `X${x}Y${y}`;
}

//Looks weird but will be fixed when we have an actuall wolrd generated,
//not is just for differentiating the different tiles when rendered with a slightly pleasing pattern

 */
export function getColor(x: number, y: number): string {
    const r = Math.floor(0 + Math.sin(x) * 5 * 3);
    const g = Math.floor(130 + Math.sin(x - y) * 10 * 3);
    const b = Math.floor(25 + ((x * y) % 10) * 3);
    return rgbToHex(r, g, b);
}
export interface Tile {
    color: String;
    x: number;
    y: number;
}
export type TileCollection = { [position: string]: Tile };

export function renderChunks(state: DataTree): RenderNode {
    const renderNodeContainer = container();
    const tiles = state.get(["world", "tiles"]).value<TileCollection>();
    for (const key in tiles) {
        if (tiles.hasOwnProperty(key)) {
            const tile = tiles[key];
            renderNodeContainer.children.push(
                rectangle({
                    x: tile.x * 64,
                    y: tile.y * 64,
                    color: getColor(tile.x, tile.y),
                    width: 64,
                    height: 64
                })
            );
        }
    }
    return renderNodeContainer;
}

export function getChunk() {
    const chunks = [];
    for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
            chunks.push({
                x,
                y
            });
        }
    }
    return chunks;
}

export function getTile(point: Point): Tile {
    return {
        x: point.x,
        y: point.y,
        color: getColor(point.x, point.y)
    };
}
