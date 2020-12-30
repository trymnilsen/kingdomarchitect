import { CHUNK_SIZE, TILES_PER_CHUNK, TILE_SIZE } from "../constants";
import { Camera } from "../rendering/camera";
import { rectangle } from "../rendering/items/rectangle";
import { container, RenderNode } from "../rendering/items/renderNode";
import { text } from "../rendering/items/text";
import { Chunk, GameState, getTileOffset } from "../state/gameState";
import { GameScene } from "./gameScene";

export class MainScene implements GameScene {
    onRender(gameState: GameState, camera: Camera): RenderNode {
        const world = container();
        world.children.push(this.renderTiles(Object.values(gameState.chunks)));
        return world;
    }

    private renderTiles(chunks: Chunk[]): RenderNode {
        const allChunks = container();
        chunks.forEach((chunk) => {
            const chunkContainer = container({
                x: chunk.position.x * CHUNK_SIZE,
                y: chunk.position.y * CHUNK_SIZE,
            });

            for (let tileX = 0; tileX < TILES_PER_CHUNK; tileX++) {
                for (let tileY = 0; tileY < TILES_PER_CHUNK; tileY++) {
                    const tileOffset = getTileOffset({ x: tileX, y: tileY });
                    const tileVisual = rectangle({
                        x: tileX * TILE_SIZE + 2,
                        y: tileY * TILE_SIZE + 2,
                        width: TILE_SIZE - 4,
                        height: TILE_SIZE - 4,
                        fill: getTileColor(chunk.tileMap[tileOffset]),
                    });
                    const tilePositionLabel = text({
                        x: tileX * TILE_SIZE + 4,
                        y: tileY * TILE_SIZE + 4,
                        text: `P: ${tileX}/${tileY}`,
                        color: "black",
                    });
                    const roomLabel = text({
                        x: tileX * TILE_SIZE + 4,
                        y: tileY * TILE_SIZE + 20,
                        text: `R: ${chunk.roomMap[tileOffset]}`,
                        color: "black",
                    });
                    const typeLabel = text({
                        x: tileX * TILE_SIZE + 4,
                        y: tileY * TILE_SIZE + 40,
                        text: `T: ${chunk.tileMap[tileOffset]}`,
                        color: "black",
                    });
                    const chunkBorder = rectangle({
                        x: 0,
                        y: 0,
                        width: CHUNK_SIZE,
                        height: CHUNK_SIZE,
                        strokeWidth: 1,
                        strokeColor: "blue",
                    });

                    chunkContainer.children.push(tileVisual);
                    chunkContainer.children.push(tilePositionLabel);
                    chunkContainer.children.push(roomLabel);
                    chunkContainer.children.push(typeLabel);
                    chunkContainer.children.push(chunkBorder);
                }
            }

            allChunks.children.push(chunkContainer);
        });

        return allChunks;
    }
}

function getTileColor(tileType: number): string {
    if (tileType === 1) {
        return "#033800";
    } else {
        return "#32a852";
    }
}
