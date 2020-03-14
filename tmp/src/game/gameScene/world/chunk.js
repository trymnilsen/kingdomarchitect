"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renderNode_1 = require("../../rendering/items/renderNode");
const rectangle_1 = require("../../rendering/items/rectangle");
const color_1 = require("../../../util/color");
class ChunkHandler {
    constructor(container) {
        this.chunks = {};
        this.container = container;
        this.buildChunks();
    }
    render(context) { }
    buildChunks() {
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
exports.ChunkHandler = ChunkHandler;
exports.bufferChunks = 2;
exports.TilesPerChunck = 3;
exports.TileSize = 64;
exports.ChunkSize = exports.TilesPerChunck * exports.TileSize;
class Chunk {
    constructor(container, x, y) {
        this.tiles = [];
        this.chunkContainer = new renderNode_1.RenderNode();
        this.chunkContainer.position = {
            x: x * exports.ChunkSize,
            y: y * exports.ChunkSize
        };
        container.addChild(this.chunkContainer);
        for (let x = 0; x < exports.TilesPerChunck; x++) {
            for (let y = 0; y < exports.TilesPerChunck; y++) {
                const tile = new Tile(this.chunkContainer, { x, y }, getColor(x, y));
            }
        }
    }
    render(context) { }
}
exports.Chunk = Chunk;
class Tile {
    constructor(container, position, color) {
        this.x = position.x;
        this.y = position.y;
        this.tileVisual = new rectangle_1.Rectangle({
            x: this.x * exports.TileSize + 4,
            y: this.y * exports.TileSize + 4,
            width: exports.TileSize - 8,
            height: exports.TileSize - 8,
            color
        });
        container.addChild(this.tileVisual);
    }
    render(context) { }
}
exports.Tile = Tile;
function getChunkId(x, y) {
    return `X${x}Y${y}`;
}
exports.getChunkId = getChunkId;
//Looks weird but will be fixed when we have an actuall wolrd generated,
//not is just for differentiating the different tiles when rendered with a slightly pleasing pattern
function getColor(x, y) {
    const r = Math.floor(0 + Math.sin(x) * 5 * 3);
    const g = Math.floor(130 + Math.sin(x - y) * 10 * 3);
    const b = Math.floor(25 + ((x * y) % 10) * 3);
    return color_1.rgbToHex(r, g, b);
}
exports.getColor = getColor;
//# sourceMappingURL=chunk.js.map