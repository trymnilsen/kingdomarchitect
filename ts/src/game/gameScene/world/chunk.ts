import { RenderNode } from "../../rendering/items/renderNode";
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

    private buildChunks() {
        const horizontalChunks = Math.ceil(window.innerWidth / ChunkSize);
        const verticalChunks = Math.ceil(window.innerHeight / ChunkSize);
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
export const TilesPerChunck = 8;
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
export function getColor(x: number, y: number): string {
    const r = Math.floor(0 + Math.sin(x) * 5 * 3);
    const g = Math.floor(130 + Math.sin(x - y) * 10 * 3);
    const b = Math.floor(25 + ((x * y) % 10) * 3);
    return rgbToHex(r, g, b);
}
