import type { Bounds } from "../../common/bounds.js";
import {
    encodePosition,
    makeNumberId,
    type Point,
} from "../../common/point.js";
import { EcsSystem } from "../../common/ecs/ecsSystem.js";
import { biomes } from "../map/biome.js";
import { ChunkDimension, ChunkSize } from "../map/chunk.js";
import { TileSize } from "../map/tile.js";
import { DrawMode } from "../../rendering/drawMode.js";
import type { RenderScope } from "../../rendering/renderScope.js";
import {
    HealthComponentId,
    type HealthComponent,
} from "../component/healthComponent.js";
import {
    SpriteComponent,
    SpriteComponentId,
} from "../component/spriteComponent.js";
import { TileComponent, TileComponentId } from "../component/tileComponent.js";
import {
    hasDiscovered,
    isVisible,
    VisibilityMapComponentId,
} from "../component/visibilityMapComponent.js";
import type { Entity } from "../entity/entity.js";
import { offsetPatternWithPoint } from "../../common/pattern.js";
import { VisibilityComponentId } from "../component/visibilityComponent.js";
import {
    AnimationComponentId,
    type AnimationComponent,
} from "../component/animationComponent.js";

export const renderSystem: EcsSystem = {
    onRender,
};

function onRender(
    rootEntity: Entity,
    renderScope: RenderScope,
    drawMode: DrawMode,
) {
    const renderStart = performance.now();
    const viewport = renderScope.camera.tileSpaceViewPort;
    //TODO: If i make a map/set structure with both string and instance keys
    //i can add a first method to it to avoid getting values
    const tiles = rootEntity.requireEcsComponent(TileComponentId);
    const visibilityMap = rootEntity.requireEcsComponent(
        VisibilityMapComponentId,
    );
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

    drawTiles(tiles, renderScope, rootEntity);
    const query = rootEntity.queryComponentsWithin(viewport, SpriteComponentId);

    const sortedSprites = Array.from(query.entries()).sort(
        (a, b) => a[0].worldPosition.y - b[0].worldPosition.y,
    );

    for (let i = 0; i < sortedSprites.length; i++) {
        const sprite = sortedSprites[i][1];
        const position = sortedSprites[i][0].worldPosition;
        const visibility = isVisible(visibilityMap, position.x, position.y);
        if (visibility || window.debugChunks) {
            const animationComponent =
                sortedSprites[i][0].getEcsComponent(AnimationComponentId);

            drawSprite(sprite, position, renderScope, drawMode);
        }
    }

    const healthbars = rootEntity.queryComponentsWithin(
        viewport,
        HealthComponentId,
    );

    for (const [entity, healthComponent] of healthbars) {
        if (healthComponent.currentHp == healthComponent.maxHp) {
            continue;
        }
        drawHealthbar(renderScope, entity, healthComponent);
    }

    const renderEnd = performance.now();
    performance.measure("render duration", {
        start: renderStart,
        end: renderEnd,
    });
}

function drawHealthbar(
    renderContext: RenderScope,
    entity: Entity,
    healthComponent: HealthComponent,
) {
    const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
        entity.worldPosition,
    );
    const healthbarWidth = 32;
    const maxHp = healthComponent.maxHp > 0 ? healthComponent.maxHp : 1;
    const percentageWidth = Math.floor(
        (healthbarWidth - 4) * (healthComponent.currentHp / maxHp),
    );

    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 3,
        y: screenPosition.y + 24,
        width: healthbarWidth,
        height: 8,
        fill: "black",
    });
    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 5,
        y: screenPosition.y + 2 + 24,
        width: percentageWidth,
        height: 4,
        fill: "green",
    });
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
    rootEntity: Entity,
) {
    const visibility = rootEntity.requireEcsComponent(VisibilityMapComponentId);
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
            screenPosition.x + ChunkSize * 40 > 0 &&
            screenPosition.y + ChunkSize * 40 > 0 &&
            screenPosition.x - 40 < renderContext.width &&
            screenPosition.y - 40 < renderContext.height;

        if (!withinTheViewport) {
            continue;
        }

        for (let x = 0; x < ChunkSize; x++) {
            const screenTileX = screenPosition.x + x * 40;
            const worldTileX = chunkPosition.x + x;
            const xWithin =
                screenTileX + 40 > 0 && screenTileX - 40 < renderContext.width;
            if (!xWithin) {
                continue;
            }

            for (let y = 0; y < ChunkSize; y++) {
                const screenTileY = screenPosition.y + y * 40;
                const worldTileY = chunkPosition.y + y;
                let visible = true;

                if (!window.debugChunks) {
                    if (!hasDiscovered(visibility, chunkNumberId, x, y)) {
                        continue;
                    }

                    visible = isVisible(visibility, worldTileX, worldTileY);
                }

                let color = biomes[chunk.volume.type].color;
                if (!visible) {
                    color = biomes[chunk.volume.type].tint;
                }

                renderContext.drawScreenSpaceRectangle({
                    x: screenTileX,
                    y: screenTileY,
                    width: TileSize - 2,
                    height: TileSize - 2,
                    fill: color,
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
                text: `maxSize: ${chunk.volume.maxSize}`,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16 + 40,
                color: "black",
                size: 14,
                font: "arial",
            });
            renderContext.drawText({
                text: `size: ${chunk.volume.chunks.length}`,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16 + 60,
                color: "black",
                size: 14,
                font: "arial",
            });
        }
    }
}
