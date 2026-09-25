import { type EcsSystem } from "../../ecs/ecsSystem.ts";
import type { Bounds } from "../../common/bounds.ts";
import { encodePosition, type Point } from "../../common/point.ts";
import { DrawMode } from "../../rendering/drawMode.ts";
import type { RenderScope } from "../../rendering/renderScope.ts";
import {
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
import type { BiomeType } from "../map/biome.ts";
import { biomeTileShades, TileColorVariation } from "../map/biomeTileShades.ts";
import { ChunkDimension, ChunkSize, getTerrainInChunk } from "../map/chunk.ts";
import type { Terrain } from "../map/terrain.ts";
import { tileShadeIndex } from "../map/deterministicTileColor.ts";
import { TileSize } from "../map/tile.ts";
import {
    ambientIsLight,
    collectLightClaims,
    computeLitTiles,
    isTileLit,
} from "../light/lightClaims.ts";
import {
    ChunkMapComponentId,
    collectEntitiesInRow,
    type ChunkMap,
} from "../component/chunkMapComponent.ts";

export const renderSystem: EcsSystem = {
    onRender,
};

const spriteGatherMargin = 2;

// shared across frames since render is never reentrant
const rowEntities: Entity[] = [];
const rowDrawEntities: Entity[] = [];
const rowDrawSprites: SpriteComponent[] = [];

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
    const chunkMap = rootEntity.getEcsComponent(ChunkMapComponentId)?.chunkMap;
    if (chunkMap) {
        drawSprites(
            chunkMap,
            renderScope,
            drawMode,
            visibilityMap,
            litTiles,
            phase,
        );
    }
}

function drawSprites(
    chunkMap: ChunkMap,
    renderScope: RenderScope,
    drawMode: DrawMode,
    visibilityMap: VisibilityMapComponent | null,
    litTiles: ReadonlySet<number>,
    phase: Phase,
) {
    const viewport = renderScope.camera.tileSpaceViewPort;
    const bounds: Bounds = {
        x1: viewport.x1 - spriteGatherMargin,
        y1: viewport.y1 - spriteGatherMargin,
        x2: viewport.x2 + spriteGatherMargin,
        y2: viewport.y2 + spriteGatherMargin,
    };

    for (let y = bounds.y1; y <= bounds.y2; y++) {
        rowEntities.length = 0;
        collectEntitiesInRow(chunkMap, y, bounds.x1, bounds.x2, rowEntities);

        rowDrawEntities.length = 0;
        rowDrawSprites.length = 0;
        for (let i = 0; i < rowEntities.length; i++) {
            const entity = rowEntities[i];
            const sprite = entity.getEcsComponent(SpriteComponentId);
            if (!sprite) {
                continue;
            }
            if (
                !isSpriteShown(
                    entity.worldPosition,
                    visibilityMap,
                    litTiles,
                    phase,
                )
            ) {
                continue;
            }
            insertByDepth(entity, sprite);
        }

        for (let i = 0; i < rowDrawEntities.length; i++) {
            drawSprite(
                rowDrawSprites[i],
                rowDrawEntities[i].worldPosition,
                renderScope,
                drawMode,
            );
        }
    }
}

function isSpriteShown(
    position: Point,
    visibilityMap: VisibilityMapComponent | null,
    litTiles: ReadonlySet<number>,
    phase: Phase,
): boolean {
    if (window.debugChunks || !visibilityMap) {
        return true;
    }
    // an attacker in the dark stays unseen on purpose
    return (
        hasDiscoveredWorldTile(visibilityMap, position.x, position.y) &&
        isTileLit(litTiles, phase, position)
    );
}

function insertByDepth(entity: Entity, sprite: SpriteComponent) {
    // insertion sort on purpose so equal depths keep their x order
    const depth = sprite.depth ?? 0;
    let index = rowDrawEntities.length;
    rowDrawEntities.push(entity);
    rowDrawSprites.push(sprite);
    while (index > 0 && (rowDrawSprites[index - 1].depth ?? 0) > depth) {
        rowDrawEntities[index] = rowDrawEntities[index - 1];
        rowDrawSprites[index] = rowDrawSprites[index - 1];
        index--;
    }
    rowDrawEntities[index] = entity;
    rowDrawSprites[index] = sprite;
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
 * Dev-only overlay that marks each tile lit (L) or dark (D). It reads the
 * frame's coverage set rather than deriving its own, so what it shows is the
 * same field the game logic uses.
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

function tileShadesFor(
    biomeType: BiomeType,
    terrain: Terrain,
    phase: Phase,
    lit: boolean,
): string[] {
    const shades = biomeTileShades[biomeType][terrain];
    if (!lit) {
        return shades.dark;
    }
    if (ambientIsLight(phase)) {
        return shades.bright;
    }
    return shades.dim;
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
        const chunkNumberId = encodePosition(chunk.chunkX, chunk.chunkY);
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
                const yWithin =
                    screenTileY + TileSize > 0 &&
                    screenTileY - TileSize < renderContext.height;
                if (!yWithin) {
                    continue;
                }
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

                const shades = tileShadesFor(
                    chunk.volume.type,
                    getTerrainInChunk(chunk, x, y),
                    phase,
                    lit,
                );
                const finalColor =
                    shades[
                        tileShadeIndex(
                            worldTileX,
                            worldTileY,
                            TileColorVariation,
                        )
                    ];

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
