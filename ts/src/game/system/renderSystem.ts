import { mapAndFilter } from "../../common/array.js";
import type { Bounds } from "../../common/bounds.js";
import { encodePosition } from "../../common/point.js";
import { DrawMode } from "../../rendering/drawMode.js";
import type { RenderScope } from "../../rendering/renderScope.js";
import type { RenderVisibilityMap } from "../../rendering/renderVisibilityMap.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import type { SpriteProviderConfig } from "../component/draw/spriteProvider/spriteProvider.js";
import { SpriteStateMachine } from "../component/draw/spriteProvider/statemachine/spriteStateMachine.js";
import type { EntityComponent } from "../component/entityComponent.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { SpatialChunkMapComponent } from "../component/world/spatialChunkMapComponent.js";
import type { Entity } from "../entity/entity.js";
import { biomes } from "../map/biome.js";
import { ChunkDimension, ChunkSize } from "../map/chunk.js";
import { getTileId, TileSize } from "../map/tile.js";

type EntityComponentPair = {
    entity: Entity;
    spriteComponent: SpriteComponent;
};

export function renderSystem(
    rootEntity: Entity,
    renderContext: RenderScope,
    visibilityMap: RenderVisibilityMap,
    mode: DrawMode,
) {
    const renderStart = performance.now();
    const spatialMap = rootEntity.requireComponent(SpatialChunkMapComponent);
    const viewport = renderContext.camera.tileSpaceViewPort;
    const entities = spatialMap.getEntitiesWithin(viewport);
    const components: EntityComponentPair[] = [];
    drawTiles(rootEntity, renderContext, visibilityMap);
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const spriteComponent = entity.getComponent(SpriteComponent);
        if (spriteComponent) {
            components.push({ entity, spriteComponent });
        }
    }

    const sortedSprites = components.sort(
        (a, b) => a.entity.worldPosition.y - b.entity.worldPosition.y,
    );

    for (let i = 0; i < sortedSprites.length; i++) {
        const sprite = sortedSprites[i];
        drawSprite(rootEntity, renderContext, sprite.spriteComponent, mode);
    }

    const renderEnd = performance.now();
    performance.measure("render duration", {
        start: renderStart,
        end: renderEnd,
    });
}

function drawSprite(
    _rootEntity: Entity,
    renderContext: RenderScope,
    spriteComponent: SpriteComponent,
    drawMode: DrawMode,
) {
    const scale = 1;

    let targetWidth = spriteComponent.size?.x;
    let targetHeight = spriteComponent.size?.y;

    if (targetWidth) {
        targetWidth = targetWidth * scale;
    } else {
        targetWidth =
            renderContext.measureSprite(spriteComponent.sprite).width * scale;
    }

    if (targetHeight) {
        targetHeight = targetHeight * scale;
    } else {
        targetHeight =
            renderContext.measureSprite(spriteComponent.sprite).height * scale;
    }

    if (drawMode == DrawMode.Tick && !!spriteComponent.tint) {
        // if there are no frames left, clear it
        if (spriteComponent.tint.frames == 0) {
            console.log("Resetting sprite tint");
            spriteComponent.tint = null;
        } else if (spriteComponent.tint.frames > 0) {
            console.log("Subtracting sprite tint");
            spriteComponent.tint.frames -= 1;
        }
    }

    let spriteConfig: SpriteProviderConfig | null = null;
    let frame = 0;
    const component = spriteComponent.entity.getComponent(SpriteStateMachine);
    if (component) {
        spriteConfig = component.updateSpriteConfiguration(
            renderContext.drawTick,
            drawMode,
        );
        frame = spriteConfig.frame;
    }

    const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
        spriteComponent.entity.worldPosition,
    );

    renderContext.drawScreenSpaceSprite({
        frame: frame,
        sprite: spriteConfig?.sprite ?? spriteComponent.sprite,
        x: screenPosition.x + spriteComponent.offset.x,
        y: screenPosition.y + spriteComponent.offset.y,
        targetHeight: targetHeight,
        targetWidth: targetWidth,
        tint: spriteComponent.tint?.color,
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
    rootEntity: Entity,
    renderContext: RenderScope,
    visibilityMap: RenderVisibilityMap,
) {
    const tileComponent = rootEntity.requireComponent(TilesComponent);
    for (const [chunkId, chunk] of tileComponent._chunks) {
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
            const tileX = screenPosition.x + x * 40;
            const xWithin = tileX + 40 > 0 && tileX - 40 < renderContext.width;
            if (!xWithin) {
                continue;
            }

            for (let y = 0; y < ChunkSize; y++) {
                const tileY = screenPosition.y + y * 40;
                let visible = true;

                if (visibilityMap.useVisibility) {
                    if (!chunk.discovered.has(getTileId(x, y))) {
                        continue;
                    }

                    visible = visibilityMap.isVisible(tileX, tileY);
                }

                let color = biomes[chunk.volume.type].color;
                if (!visible) {
                    biomes[chunk.volume.type].tint;
                }

                renderContext.drawScreenSpaceRectangle({
                    x: tileX,
                    y: tileY,
                    width: TileSize - 2,
                    height: TileSize - 2,
                    fill: color,
                });
            }
        }

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
            text: `size: ${chunk.volume.size}`,
            x: screenPosition.x + 16,
            y: screenPosition.y + 16 + 60,
            color: "black",
            size: 14,
            font: "arial",
        });

        if (visibilityMap.useVisibility) {
            renderContext.drawDottedLine(
                screenPosition.x + 8,
                screenPosition.y + 4,
                screenPosition.x + ChunkDimension - 8,
                screenPosition.y + 4,
                biomes.forrest.tint,
                8,
            );

            renderContext.drawDottedLine(
                screenPosition.x + ChunkDimension - 4,
                screenPosition.y + 8,
                screenPosition.x + ChunkDimension - 4,
                screenPosition.y + ChunkDimension - 8,
                biomes.forrest.tint,
                8,
            );

            renderContext.drawDottedLine(
                screenPosition.x + 8,
                screenPosition.y + ChunkDimension - 4,
                screenPosition.x + ChunkDimension - 8,
                screenPosition.y + ChunkDimension - 4,
                biomes.forrest.tint,
                8,
            );

            renderContext.drawDottedLine(
                screenPosition.x + 4,
                screenPosition.y + 8,
                screenPosition.x + 4,
                screenPosition.y + ChunkDimension - 8,
                biomes.forrest.tint,
                8,
            );
        }
    }
}
