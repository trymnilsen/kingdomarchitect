import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import type { RenderScope } from "../../rendering/renderScope.ts";
import type { Entity } from "../entity/entity.ts";
import { GoblinCampComponentId } from "../component/goblinCampComponent.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import { RaidingComponentId } from "../component/raidingComponent.ts";
import { kingdomScore } from "../raid/kingdomScore.ts";
import { campSizeForScore } from "../raid/campSize.ts";
import { initialRaidThreshold } from "../raid/goblinRaid.ts";

/**
 * Debug readout for goblin raid pacing, drawn when window.debugChunks is on
 * (the same switch as the chunk volume overlay). Shows, per camp, the numbers
 * that decide when and how hard the goblins strike: the raid bar it waits for
 * against the live kingdom score (also on the status bar as "ks"), its
 * population against its cap, and the size the camp size table currently
 * supports. Everything is derived on read so the overlay can never disagree
 * with what the raid systems will actually do.
 */
export const raidDebugSystem: EcsSystem = {
    onRender: (root, _renderTick, renderScope, _drawMode) => {
        if (!window.debugChunks) {
            return;
        }

        const score = kingdomScore(root);
        for (const [campEntity, camp] of root.queryComponents(
            GoblinCampComponentId,
        )) {
            const screenPosition = renderScope.camera.tileSpaceToScreenSpace(
                campEntity.worldPosition,
            );

            // The bar is seeded lazily on the camp's first raid evaluation, so
            // show the bar it will seed until then.
            let threshold = camp.nextRaidThreshold;
            if (threshold <= 0) {
                threshold = initialRaidThreshold(
                    root,
                    campEntity.worldPosition,
                );
            }

            const population = campPopulation(campEntity);
            const lines = [
                `raid at: ${Math.round(threshold)} (score ${score})`,
                `camp: ${population}/${camp.maxPopulation}`,
                `table size: ${campSizeForScore(score)}`,
            ];
            lines.forEach((line, index) => {
                drawDebugLine(
                    renderScope,
                    screenPosition.x,
                    screenPosition.y + index * 20,
                    line,
                );
            });
        }
    },
};

function campPopulation(campEntity: Entity): number {
    let count = 0;
    for (const child of campEntity.children) {
        if (
            child.hasComponent(GoblinUnitComponentId) &&
            !child.hasComponent(RaidingComponentId)
        ) {
            count++;
        }
    }
    return count;
}

function drawDebugLine(
    renderScope: RenderScope,
    x: number,
    y: number,
    text: string,
): void {
    renderScope.drawText({
        text,
        x,
        y,
        color: "black",
        size: 14,
        font: "arial",
    });
}
