import {
    generateDiscPattern,
    offsetPatternWithPoint,
} from "../../../../common/pattern.ts";
import type { Point } from "../../../../common/point.ts";
import { RenderScope } from "../../../../rendering/renderScope.ts";
import {
    EnergyComponentId,
    type EnergyComponent,
} from "../../../component/energyComponent.ts";
import {
    HealthComponentId,
    type HealthComponent,
} from "../../../component/healthComponent.ts";
import { LightSourceComponentId } from "../../../component/lightSourceComponent.ts";
import { ProductionComponentId } from "../../../component/productionComponent.ts";
import { VisibilityComponentId } from "../../../component/visibilityComponent.ts";
import { resolveLightSource } from "../../../light/resolveLightSource.ts";
import { getProductionDefinition } from "../../../../data/production/productionDefinition.ts";
import type { Entity } from "../../../entity/entity.ts";
import {
    getJobForWorker,
    getJobsTargetingEntity,
    getJobTargetPosition,
} from "../../../job/jobQuery.ts";
import { discoveryFootprintOffsets } from "../../../map/discoverFootprint.ts";
import { getDiamondPoints } from "../../../map/item/placement.ts";
import { TileSize, HalfTileSize } from "../../../map/tile.ts";
import { SelectedEntityItem } from "../../selection/selectedEntityItem.ts";

const claimedLinkColor = "#5fbf5f";
const unclaimedMarkerColor = "#ffb000";
const jobLinkWidth = 2;

/**
 * Draw the world space decorations for whatever the player has selected.
 *
 * These read live component state on every frame and draw straight to the
 * render scope. Nothing here is cached, so a selection always shows the current
 * truth rather than a snapshot taken when it was made.
 */
export function drawSelectionOverlays(
    context: RenderScope,
    selection: SelectedEntityItem,
) {
    drawJobLinks(context, selection);
    drawDiscoveryRange(context, selection.entity);
    drawLightEmission(context, selection.entity);
    drawProductionZone(context, selection.entity);
    drawVitalBars(context, selection.entity);
}

/**
 * Draw the job relationships for the selected entity, derived live from the job
 * queue each frame. A worker shows a line to the job it is performing; an entity
 * that is the target of work shows a line to whoever claimed it, or an amber box
 * when the work is queued but unclaimed.
 */
function drawJobLinks(context: RenderScope, selection: SelectedEntityItem) {
    const entity = selection.entity;
    const root = entity.getRootEntity();

    const workerJob = getJobForWorker(entity);
    if (workerJob && workerJob.id !== "moveToJob") {
        const targetPosition = getJobTargetPosition(root, workerJob);
        if (targetPosition) {
            drawDottedLink(
                context,
                entity.worldPosition,
                targetPosition,
                claimedLinkColor,
            );
        }
    }

    for (const job of getJobsTargetingEntity(entity)) {
        if (job.claimedBy) {
            const worker = root.findEntity(job.claimedBy);
            if (worker) {
                drawDottedLink(
                    context,
                    entity.worldPosition,
                    worker.worldPosition,
                    claimedLinkColor,
                );
            }
        } else {
            drawUnclaimedMarker(context, selection);
        }
    }
}

/**
 * Draws the tiles a selected entity uncovers on the map as small boxes: its
 * discovery diamond plus, for an emitter, its lit footprint. "What can this
 * entity see right now" no longer exists per entity, because visibility is
 * discovered-and-lit globally. How far the entity reveals the map is still
 * useful selection feedback, so that is what this shows.
 */
function drawDiscoveryRange(context: RenderScope, entity: Entity) {
    const visibility = entity.getEcsComponent(VisibilityComponentId);
    if (!visibility) {
        return;
    }
    const tiles = offsetPatternWithPoint(
        entity.worldPosition,
        discoveryFootprintOffsets(entity),
    );
    for (const tile of tiles) {
        context.drawRectangle({
            x: tile.x * TileSize + 8,
            y: tile.y * TileSize + 8,
            width: 6,
            height: 6,
            fill: "rgba(120, 170, 255, 0.5)",
        });
    }
}

/**
 * Draws the tiles a selected light source lights, derived from the same shape
 * the coverage field stamps: the component's pattern when present, otherwise
 * the definition's disc. Sharing the shape keeps the overlay honest, and a
 * selected manned tower shows its searchlight wedge automatically.
 */
function drawLightEmission(context: RenderScope, entity: Entity) {
    const lightSource = entity.getEcsComponent(LightSourceComponentId);
    if (!lightSource) {
        return;
    }
    let offsets = lightSource.pattern;
    if (offsets === null) {
        const definition = resolveLightSource(entity, lightSource);
        if (!definition) {
            return;
        }
        offsets = generateDiscPattern(definition.lightRadius);
    }
    const origin = entity.worldPosition;
    for (const offset of offsets) {
        context.drawRectangle({
            x: (origin.x + offset.x) * TileSize + 22,
            y: (origin.y + offset.y) * TileSize + 22,
            width: 6,
            height: 6,
            fill: "rgba(255, 221, 0, 0.4)",
        });
    }
}

/**
 * Marks the tiles a zone production building draws from, so the player can see
 * its working area before committing to a spot.
 */
function drawProductionZone(context: RenderScope, entity: Entity) {
    const productionComponent = entity.getEcsComponent(ProductionComponentId);
    if (!productionComponent) {
        return;
    }
    const definition = getProductionDefinition(
        productionComponent.productionId,
    );
    if (definition?.kind !== "zone") {
        return;
    }
    const zonePoints = getDiamondPoints(
        entity.worldPosition,
        definition.zoneRadius,
    );
    for (const zonePoint of zonePoints) {
        context.drawRectangle({
            x: zonePoint.x * TileSize + 14,
            y: zonePoint.y * TileSize + 14,
            width: 8,
            height: 8,
            fill: "lightgreen",
        });
    }
}

/**
 * Draws the health and energy bars above a selected entity.
 *
 * An entity carrying both gets its health bar pushed up to make room, which is
 * why the two are placed together here instead of independently.
 */
function drawVitalBars(context: RenderScope, entity: Entity) {
    const healthComponent = entity.getEcsComponent(HealthComponentId);
    const energyComponent = entity.getEcsComponent(EnergyComponentId);

    if (healthComponent) {
        const healthbarYOffset = energyComponent ? -18 : -8;
        drawHealthbar(context, entity, healthComponent, healthbarYOffset);
    }
    if (energyComponent) {
        drawEnergyBar(context, entity, energyComponent);
    }
}

function drawDottedLink(
    context: RenderScope,
    from: Point,
    to: Point,
    color: string,
) {
    const fromScreen = context.camera.tileSpaceToScreenSpace(from);
    const toScreen = context.camera.tileSpaceToScreenSpace(to);
    context.drawDottedLine(
        fromScreen.x + HalfTileSize,
        fromScreen.y + HalfTileSize,
        toScreen.x + HalfTileSize,
        toScreen.y + HalfTileSize,
        color,
        jobLinkWidth,
    );
}

function drawUnclaimedMarker(
    context: RenderScope,
    selection: SelectedEntityItem,
) {
    const topLeft = context.camera.tileSpaceToScreenSpace(
        selection.tilePosition,
    );
    const x1 = topLeft.x;
    const y1 = topLeft.y;
    const x2 = topLeft.x + selection.selectionSize.x * TileSize;
    const y2 = topLeft.y + selection.selectionSize.y * TileSize;

    context.drawDottedLine(x1, y1, x2, y1, unclaimedMarkerColor, jobLinkWidth);
    context.drawDottedLine(x2, y1, x2, y2, unclaimedMarkerColor, jobLinkWidth);
    context.drawDottedLine(x2, y2, x1, y2, unclaimedMarkerColor, jobLinkWidth);
    context.drawDottedLine(x1, y2, x1, y1, unclaimedMarkerColor, jobLinkWidth);
}

function drawHealthbar(
    renderContext: RenderScope,
    entity: Entity,
    healthComponent: HealthComponent,
    healthbarYOffset: number,
) {
    const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
        entity.worldPosition,
    );
    const healthbarWidth = 28;
    const maxHp = healthComponent.maxHp > 0 ? healthComponent.maxHp : 1;
    const percentageWidth = Math.floor(
        (healthbarWidth - 4) * (healthComponent.currentHp / maxHp),
    );

    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 3,
        y: screenPosition.y + healthbarYOffset,
        width: healthbarWidth,
        height: 8,
        fill: "black",
    });
    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 5,
        y: screenPosition.y + 2 + healthbarYOffset,
        width: percentageWidth,
        height: 4,
        fill: "green",
    });
}

function drawEnergyBar(
    renderContext: RenderScope,
    entity: Entity,
    energyComponent: EnergyComponent,
) {
    const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
        entity.worldPosition,
    );
    const barWidth = 28;
    const barYOffset = -8;
    const maxEnergy =
        energyComponent.maxEnergy > 0 ? energyComponent.maxEnergy : 1;
    const percentageWidth = Math.floor(
        (barWidth - 4) * (energyComponent.energy / maxEnergy),
    );

    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 3,
        y: screenPosition.y + barYOffset,
        width: barWidth,
        height: 8,
        fill: "black",
    });
    renderContext.drawScreenSpaceRectangle({
        x: screenPosition.x + 5,
        y: screenPosition.y + 2 + barYOffset,
        width: percentageWidth,
        height: 4,
        fill: "#4488ff",
    });
}
