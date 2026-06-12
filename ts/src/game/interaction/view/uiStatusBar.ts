import type { Entity } from "../../entity/entity.ts";
import { DayComponentId } from "../../component/dayComponent.ts";
import { BehaviorAgentComponentId } from "../../component/BehaviorAgentComponent.ts";
import { PlayerUnitComponentId } from "../../component/playerUnitComponent.ts";
import { statusbarTextStyle } from "../../../rendering/text/textStyle.ts";
import { createComponent } from "../../../ui/declarative/ui.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import {
    uiRow,
    MainAxisAlignment,
    CrossAxisAlignment,
} from "../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../ui/declarative/uiText.ts";
import { colorBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize } from "../../../ui/uiSize.ts";

const BAR_HEIGHT = 28;
const PADDING_X = 12;
const BAR_FILL = "rgba(30, 30, 30, 1)";
const IDLE_HIGHLIGHT = "#f0a040";

const idleTextStyle = { ...statusbarTextStyle, color: IDLE_HIGHLIGHT };

type UiStatusBarProps = {
    root: Entity;
    key?: string | number;
};

/**
 * The top HUD strip showing phase, current day, and population.
 * Reads DayComponent from the root and queries player units for population
 * counts on each render.
 */
export const uiStatusBar = createComponent<UiStatusBarProps>(
    ({ props }) => {
        const day = props.root.getEcsComponent(DayComponentId);
        const phaseLabel = day ? capitalise(day.phase) : "Dawn";
        const dayLabel = day ? `Day ${day.currentDay}` : "Day 1";

        const { total, idle } = countPopulation(props.root);

        const rightTexts = [
            uiText({
                content: `People: ${total}`,
                textStyle: statusbarTextStyle,
            }),
        ];
        if (idle > 0) {
            rightTexts.push(
                uiText({
                    content: ` (${idle} idle)`,
                    textStyle: idleTextStyle,
                }),
            );
        }

        return uiBox({
            width: fillUiSize,
            height: BAR_HEIGHT,
            background: colorBackground(BAR_FILL),
            padding: PADDING_X,
            child: uiRow({
                width: fillUiSize,
                mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                crossAxisAlignment: CrossAxisAlignment.Center,
                children: [
                    uiText({
                        content: `${phaseLabel}  ·  ${dayLabel}`,
                        textStyle: statusbarTextStyle,
                    }),
                    uiRow({
                        crossAxisAlignment: CrossAxisAlignment.Center,
                        children: rightTexts,
                    }),
                ],
            }),
        });
    },
    { displayName: "UiStatusBar" },
);

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
