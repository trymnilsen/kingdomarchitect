import { type EcsSystem } from "../../ecs/ecsSystem.ts";
import { makeNumberId, type Point } from "../../common/point.ts";
import { DrawMode } from "../../rendering/drawMode.ts";
import type { RenderScope } from "../../rendering/renderScope.ts";
import {
    compareSpriteStacking,
    type SpriteComponent,
    SpriteComponentId,
} from "../component/spriteComponent.ts";
import {
    type TileComponent,
    TileComponentId,
} from "../component/tileComponent.ts";
import { spriteRegistry } from "../../asset/spriteRegistry.ts";
import { SPRITE_W, SPRITE_H } from "../../asset/sprite.ts";
import {
    hasDiscovered,
    hasDiscoveredWorldTile,
    VisibilityMapComponentId,
    type VisibilityMapComponent,
} from "../component/visibilityMapComponent.ts";
import { DayComponentId, type Phase } from "../component/dayComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { biomes, type BiomeType } from "../map/biome.ts";
import { biomeDimColors } from "../map/biomeDimColor.ts";
import { ChunkDimension, ChunkSize } from "../map/chunk.ts";
import { getTileColorVariation } from "../map/deterministicTileColor.ts";
import { TileSize } from "../map/tile.ts";
import {
    ambientIsLight,
    collectLightClaims,
    computeLitTiles,
    isTileLit,
} from "../light/lightClaims.ts";
import { forEachComponentWithin } from "../component/chunkMapComponent.ts";

export const renderSystem: EcsSystem = {
    onRender,
};

/**
 * Reused across frames to gather the visible sprites for depth sorting without
 * allocating a fresh array (and the chunk helper's intermediate array, and a
 * result map) on every render. Render is never reentrant, so a single shared
 * buffer is safe; it is cleared at the start of each gather.
 */
const visibleSpriteScratch: [Entity, SpriteComponent][] = [];

/**
 * Shared empty coverage for light-ambient phases. When the sky lights
 * everything, no claim needs stamping, so the render pass skips building the
 * set entirely.
 */
const noLitTiles: ReadonlySet<number> = new Set();

function onRender(
    rootEntity: Entity,
    _renderTick: number,
    renderScope: RenderScope,
    drawMode: DrawMode,
) {
    const viewport = renderScope.camera.tileSpaceViewPort;
    const tiles = rootEntity.getEcsComponent(TileComponentId);
    const visibilityMap = rootEntity.getEcsComponent(VisibilityMapComponentId);

    // A world without a day component is fully visible, so default to day.
    const phase = rootEntity.getEcsComponent(DayComponentId)?.phase ?? "day";

    // Build the lit-coverage set once per frame. This is derive-on-read rather
    // than a cache: it is rebuilt fresh every render, so moving lights cost
    // nothing extra. During light-ambient phases the ambient short-circuit in
    // isTileLit makes the set unnecessary, so skip building it.
    let litTiles: ReadonlySet<number> = noLitTiles;
    if (!ambientIsLight(phase)) {
        litTiles = computeLitTiles(
            collectLightClaims(rootEntity, "illumination"),
        );
    }

    if (tiles && visibilityMap) {
        drawTiles(tiles, renderScope, visibilityMap, litTiles, phase);
    }
    visibleSpriteScratch.length = 0;
    forEachComponentWithin(
        rootEntity,
        viewport,
        SpriteComponentId,
        (entity, sprite) => {
            visibleSpriteScratch.push([entity, sprite]);
        },
    );
    // compareSpriteStacking reads depth from the paired component, so the sort
    // needs the [entity, sprite] pairs (not bare entities) and stays free of any
    // getEcsComponent in the comparator.
    visibleSpriteScratch.sort(compareSpriteStacking);

    for (let i = 0; i < visibleSpriteScratch.length; i++) {
        const sprite = visibleSpriteScratch[i][1];
        const position = visibleSpriteScratch[i][0].worldPosition;
        // An entity is shown only where the player can see it: on a discovered
        // tile that is currently lit. A goblin attacking from an adjacent dark
        // tile is deliberately not drawn. The player watches their worker fight
        // something unseen. That is night-raid tension rather than a rendering
        // bug, so no attacker-reveal rule belongs here.
        let visible = true;
        if (!window.debugChunks && visibilityMap) {
            const discovered = hasDiscoveredWorldTile(
                visibilityMap,
                position.x,
                position.y,
            );
            visible = discovered && isTileLit(litTiles, phase, position);
        }
        if (visible) {
            drawSprite(sprite, position, renderScope, drawMode);
        }
    }
}

function drawSprite(
    spriteComponent: SpriteComponent,
    position: Point,
    renderContext: RenderScope,
    _drawMode: DrawMode,
) {
    const sprite = spriteRegistry.resolve(spriteComponent.sprite);
    if (!sprite) {
        return;
    }

    const scale = 2;

    let targetWidth = spriteComponent.size?.x;
    let targetHeight = spriteComponent.size?.y;

    if (targetWidth) {
        targetWidth = targetWidth * scale;
    } else {
        targetWidth = sprite[SPRITE_W] * scale;
    }

    if (targetHeight) {
        targetHeight = targetHeight * scale;
    } else {
        targetHeight = sprite[SPRITE_H] * scale;
    }

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

const litOverlay = { fill: "rgba(255, 221, 0, 0.28)", label: "L" };
const darkOverlay = { fill: "rgba(0, 0, 0, 0.5)", label: "D" };

/**
 * Dev-only overlay that marks each tile lit (L) or dark (D). It consumes the
 * frame's already-built coverage set instead of deriving its own: an overlay
 * with a private derivation path can lie, and its entire value is proving the
 * field the game logic uses.
 */
function drawLitOverlay(
    renderContext: RenderScope,
    litTiles: ReadonlySet<number>,
    phase: Phase,
    worldTileX: number,
    worldTileY: number,
    screenTileX: number,
    screenTileY: number,
) {
    let overlay = darkOverlay;
    if (isTileLit(litTiles, phase, { x: worldTileX, y: worldTileY })) {
        overlay = litOverlay;
    }
    renderContext.drawScreenSpaceRectangle({
        x: screenTileX,
        y: screenTileY,
        width: TileSize,
        height: TileSize,
        fill: overlay.fill,
    });
    renderContext.drawText({
        text: overlay.label,
        x: screenTileX + TileSize / 2 - 4,
        y: screenTileY + TileSize / 2 - 7,
        color: "white",
        size: 12,
        font: "arial",
    });
}

/**
 * The fill for a discovered tile. An unlit tile renders the biome's dark tint,
 * the same faded colour fog-of-war memory has always used. A lit tile renders
 * the biome's full colour under ambient sky light, and the midpoint tint when
 * only an emitter lights it at night, which keeps night's pooled look.
 */
function tileFill(biomeType: BiomeType, phase: Phase, lit: boolean): string {
    if (!lit) {
        return biomes[biomeType].tint;
    }
    if (ambientIsLight(phase)) {
        return biomes[biomeType].color;
    }
    return biomeDimColors[biomeType];
}

function drawTiles(
    tiles: TileComponent,
    renderContext: RenderScope,
    visibilityMap: VisibilityMapComponent,
    litTiles: ReadonlySet<number>,
    phase: Phase,
) {
    for (const [_chunkId, chunk] of tiles.chunks) {
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

                // Debug mode reveals the whole map at full colour with the
                // lit overlay drawn on top, so it bypasses both gates.
                let lit = true;
                if (!window.debugChunks) {
                    const discovered = hasDiscovered(
                        visibilityMap,
                        chunkNumberId,
                        x,
                        y,
                    );
                    // An undiscovered tile is never drawn, lit or not.
                    // Discovery is memory and only proximity or placed light
                    // grants it. A discovered but unlit tile still renders as
                    // fog via tileFill.
                    if (!discovered) {
                        continue;
                    }
                    lit = isTileLit(litTiles, phase, {
                        x: worldTileX,
                        y: worldTileY,
                    });
                }

                const color = tileFill(chunk.volume.type, phase, lit);

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

                if (window.debugChunks) {
                    drawLitOverlay(
                        renderContext,
                        litTiles,
                        phase,
                        worldTileX,
                        worldTileY,
                        screenTileX,
                        screenTileY,
                    );
                }
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
