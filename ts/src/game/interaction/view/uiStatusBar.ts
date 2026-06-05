import type { RenderScope } from "../../../rendering/renderScope.ts";
import type { Entity } from "../../entity/entity.ts";
import { DayComponentId } from "../../component/dayComponent.ts";
import {
    BehaviorAgentComponentId,
} from "../../component/BehaviorAgentComponent.ts";
import { PlayerUnitComponentId } from "../../component/playerUnitComponent.ts";

const BAR_HEIGHT = 28;
const PADDING_X = 12;
const FONT = "Arial";
const FONT_SIZE = 13;
const BAR_FILL = "rgba(10, 10, 20, 0.65)";
const TEXT_COLOR = "#e8e0cc";
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
        y: (BAR_HEIGHT - FONT_SIZE) / 2,
        color: TEXT_COLOR,
        font: FONT,
        size: FONT_SIZE,
    });

    const { total, idle } = countPopulation(root);
    const populationText = `People: ${total}`;
    const idleText = idle > 0 ? `  (${idle} idle)` : "";

    // Measure the main label so we can place the idle suffix in a different colour
    const rightBaseX = renderScope.width - PADDING_X - 160;

    renderScope.drawScreenspaceText({
        text: populationText,
        x: rightBaseX,
        y: (BAR_HEIGHT - FONT_SIZE) / 2,
        color: TEXT_COLOR,
        font: FONT,
        size: FONT_SIZE,
    });

    if (idleText) {
        renderScope.drawScreenspaceText({
            text: idleText,
            x: rightBaseX + 80,
            y: (BAR_HEIGHT - FONT_SIZE) / 2,
            color: IDLE_HIGHLIGHT,
            font: FONT,
            size: FONT_SIZE,
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
