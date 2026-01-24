import type { Bounds } from "../../common/bounds.ts";
import { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { offsetPatternWithPoint } from "../../common/pattern.ts";
import {
    encodePosition,
    makeNumberId,
    type Point,
} from "../../common/point.ts";
import { DrawMode } from "../../rendering/drawMode.ts";
import type { RenderScope } from "../../rendering/renderScope.ts";
import { AnimationComponentId } from "../component/animationComponent.ts";
import {
    HealthComponentId,
    type HealthComponent,
} from "../component/healthComponent.ts";
import {
    SpriteComponent,
    SpriteComponentId,
} from "../component/spriteComponent.ts";
import { TileComponent, TileComponentId } from "../component/tileComponent.ts";
import { VisibilityComponentId } from "../component/visibilityComponent.ts";
import {
    hasDiscovered,
    isVisible,
    VisibilityMapComponentId,
    type VisibilityMapComponent,
} from "../component/visibilityMapComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { biomes } from "../map/biome.ts";
import { ChunkDimension, ChunkSize } from "../map/chunk.ts";
import { getTileColorVariation } from "../map/deterministicTileColor.ts";
import { TileSize } from "../map/tile.ts";

export const renderSystem: EcsSystem = {
    onRender,
};

function onRender(
    rootEntity: Entity,
    _renderTick: number,
    renderScope: RenderScope,
    drawMode: DrawMode,
) {
    //const renderStart = performance.now();
    const viewport = renderScope.camera.tileSpaceViewPort;
    const tiles = rootEntity.getEcsComponent(TileComponentId);
    const visibilityMap = rootEntity.getEcsComponent(VisibilityMapComponentId);

    if (visibilityMap) {
        visibilityMap.visibility.clear();
        //TODO: this might be able to piggyback of sprites? Are there entities without sprites but with visibility?
        const visibilityComponents = rootEntity.queryComponentsWithin(
            viewport,
            VisibilityComponentId,
        );
        for (const visibilityComponent of visibilityComponents) {
            const visiblePoints = offsetPatternWithPoint(
                visibilityComponent[0].worldPosition,
                visibilityComponent[1].pattern,
            );
            for (let i = 0; i < visiblePoints.length; i++) {
                const numberId = makeNumberId(
                    visiblePoints[i].x,
                    visiblePoints[i].y,
                );
                visibilityMap.visibility.add(numberId);
            }
        }
    }

    if (tiles && visibilityMap) {
        drawTiles(tiles, renderScope, visibilityMap);
    }
    const query = rootEntity.queryComponentsWithin(viewport, SpriteComponentId);

    const sortedSprites = Array.from(query.entries()).sort(
        (a, b) => a[0].worldPosition.y - b[0].worldPosition.y,
    );

    for (let i = 0; i < sortedSprites.length; i++) {
        const sprite = sortedSprites[i][1];
        const position = sortedSprites[i][0].worldPosition;
        const visibility = visibilityMap
            ? isVisible(visibilityMap, position.x, position.y)
            : true;
        if (visibility || window.debugChunks) {
            const animationComponent =
                sortedSprites[i][0].getEcsComponent(AnimationComponentId);

            drawSprite(sprite, position, renderScope, drawMode);
        }
    }

    /*const renderEnd = performance.now();
    performance.measure("render duration", {
        start: renderStart,
        end: renderEnd,
    });*/
}

function drawSprite(
    spriteComponent: SpriteComponent,
    position: Point,
    renderContext: RenderScope,
    _drawMode: DrawMode,
) {
    const scale = 2;

    let targetWidth = spriteComponent.size?.x;
    let targetHeight = spriteComponent.size?.y;

    if (targetWidth) {
        targetWidth = targetWidth * scale;
    } else {
        targetWidth = spriteComponent.sprite.defintion.w * scale;
    }

    if (targetHeight) {
        targetHeight = targetHeight * scale;
    } else {
        targetHeight = spriteComponent.sprite.defintion.h * scale;
    }

    /*
    if (drawMode == DrawMode.Tick && !!spriteComponent.tint) {
        // if there are no frames left, clear it
        if (spriteComponent.tint.frames == 0) {
            console.log("Resetting sprite tint");
            spriteComponent.tint = null;
        } else if (spriteComponent.tint.frames > 0) {
            console.log("Subtracting sprite tint");
            spriteComponent.tint.frames -= 1;
        }
    }*/
    const screenPosition =
        renderContext.camera.tileSpaceToScreenSpace(position);
    const offsetX = spriteComponent.offset?.x ?? 0;
    const offsetY = spriteComponent.offset?.y ?? 0;
    renderContext.drawScreenSpaceSprite({
        sprite: spriteComponent.sprite,
        x: screenPosition.x + offsetX,
        y: screenPosition.y + offsetY,
        targetHeight: targetHeight,
        targetWidth: targetWidth,
        tint: spriteComponent.tint?.color,
        frame: spriteComponent.frame,
    });
}

function getVisibleChunks(bounds: Bounds): number[] {
    const minChunkX = Math.floor(bounds.x1 / ChunkSize);
    const maxChunkX = Math.ceil(bounds.x2 / ChunkSize); // Ensure inclusion of overlapping chunks
    const minChunkY = Math.floor(bounds.y1 / ChunkSize);
    const maxChunkY = Math.ceil(bounds.y2 / ChunkSize); // Ensure inclusion of overlapping chunks

    const chunkKeys: number[] = [];

    for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
        for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
            chunkKeys.push(encodePosition(chunkX, chunkY));
        }
    }

    return chunkKeys;
}

function drawTiles(
    tiles: TileComponent,
    renderContext: RenderScope,
    visibilityMap: VisibilityMapComponent,
) {
    for (const [chunkId, chunk] of tiles.chunks) {
        if (!chunk.volume) {
            continue;
        }
        const chunkNumberId = makeNumberId(chunk.chunkX, chunk.chunkY);
        const chunkPosition = {
            x: chunk.chunkX * ChunkSize,
            y: chunk.chunkY * ChunkSize,
        };
        const screenPosition =
            renderContext.camera.tileSpaceToScreenSpace(chunkPosition);

        const withinTheViewport =
            screenPosition.x + ChunkSize * TileSize > 0 &&
            screenPosition.y + ChunkSize * TileSize > 0 &&
            screenPosition.x - TileSize < renderContext.width &&
            screenPosition.y - TileSize < renderContext.height;

        if (!withinTheViewport) {
            continue;
        }

        for (let x = 0; x < ChunkSize; x++) {
            const screenTileX = screenPosition.x + x * TileSize;
            const worldTileX = chunkPosition.x + x;
            const xWithin =
                screenTileX + TileSize > 0 &&
                screenTileX - TileSize < renderContext.width;
            if (!xWithin) {
                continue;
            }

            for (let y = 0; y < ChunkSize; y++) {
                const screenTileY = screenPosition.y + y * TileSize;
                const worldTileY = chunkPosition.y + y;
                let visible = true;

                if (!window.debugChunks) {
                    if (!hasDiscovered(visibilityMap, chunkNumberId, x, y)) {
                        continue;
                    }

                    visible = isVisible(visibilityMap, worldTileX, worldTileY);
                }

                let color = biomes[chunk.volume.type].color;
                if (!visible) {
                    color = biomes[chunk.volume.type].tint;
                }

                const finalColor = getTileColorVariation(
                    color,
                    { x: chunk.chunkX, y: chunk.chunkY },
                    { x, y },
                    20,
                );

                renderContext.drawScreenSpaceRectangle({
                    x: screenTileX,
                    y: screenTileY,
                    width: TileSize,
                    height: TileSize,
                    fill: finalColor,
                });
            }
        }

        if (window.debugChunks) {
            renderContext.drawScreenSpaceRectangle({
                x: screenPosition.x + 16,
                y: screenPosition.y + 16,
                width: ChunkDimension - 32,
                height: ChunkDimension - 32,
                strokeWidth: 2,
                strokeColor: chunk.volume.debugColor,
            });

            renderContext.drawText({
                text: chunk.volume.id,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16,
                color: "black",
                size: 14,
                font: "arial",
            });
            renderContext.drawText({
                text: chunk.volume.debugColor,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16 + 20,
                color: "black",
                size: 14,
                font: "arial",
            });
            renderContext.drawText({
                text: `maxSize:   ${chunk.volume.maxSize}`,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16 + 40,
                color: "black",
                size: 14,
                font: "arial",
            });
            renderContext.drawText({
                text: `size:   ${chunk.volume.chunks.length}`,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16 + 60,
                color: "black",
                size: 14,
                font: "arial",
            });
        }
    }
}
