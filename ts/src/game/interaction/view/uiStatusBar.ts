import type { RenderScope } from "../../../rendering/renderScope.ts";
import type { Entity } from "../../entity/entity.ts";
import { DayComponentId } from "../../component/dayComponent.ts";
import { BehaviorAgentComponentId } from "../../component/BehaviorAgentComponent.ts";
import { PlayerUnitComponentId } from "../../component/playerUnitComponent.ts";
import { statusbarTextStyle } from "../../../rendering/text/textStyle.ts";

const BAR_HEIGHT = 28;
const PADDING_X = 12;
const BAR_FILL = "rgba(30, 30, 30, 1)";
const IDLE_HIGHLIGHT = "#f0a040";

/**
 * Draws the top HUD strip showing phase, current day, and population.
 * Reads DayComponent from the root and queries player units for population counts.
 */
export function drawStatusBar(renderScope: RenderScope, root: Entity): void {
    const day = root.getEcsComponent(DayComponentId);

    renderScope.drawScreenSpaceRectangle({
        x: 0,
        y: 0,
        width: renderScope.width,
        height: BAR_HEIGHT,
        fill: BAR_FILL,
    });

    const phaseLabel = day ? capitalise(day.phase) : "Dawn";
    const dayLabel = day ? `Day ${day.currentDay}` : "Day 1";
    const leftText = `${phaseLabel}  ·  ${dayLabel}`;

    renderScope.drawScreenspaceText({
        text: leftText,
        x: PADDING_X,
        y: (BAR_HEIGHT - statusbarTextStyle.size) / 2,
        color: statusbarTextStyle.color,
        font: statusbarTextStyle.font,
        size: statusbarTextStyle.size,
    });

    const { total, idle } = countPopulation(root);
    const populationText = `People: ${total}`;
    const idleText = idle > 0 ? `  (${idle} idle)` : "";

    const rightBaseX = renderScope.width - PADDING_X - 160;

    renderScope.drawScreenspaceText({
        text: populationText,
        x: rightBaseX,
        y: (BAR_HEIGHT - statusbarTextStyle.size) / 2,
        color: statusbarTextStyle.color,
        font: statusbarTextStyle.font,
        size: statusbarTextStyle.size,
    });

    if (idleText) {
        renderScope.drawScreenspaceText({
            text: idleText,
            x: rightBaseX + 80,
            y: (BAR_HEIGHT - statusbarTextStyle.size) / 2,
            color: IDLE_HIGHLIGHT,
            font: statusbarTextStyle.font,
            size: statusbarTextStyle.size,
        });
    }
}

function countPopulation(root: Entity): { total: number; idle: number } {
    const playerUnits = root.queryComponents(PlayerUnitComponentId);
    let idle = 0;

    for (const [entity] of playerUnits) {
        const agent = entity.getEcsComponent(BehaviorAgentComponentId);
        if (agent && agent.currentBehaviorName === null) {
            idle += 1;
        }
    }

    return { total: playerUnits.size, idle };
}

function capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
