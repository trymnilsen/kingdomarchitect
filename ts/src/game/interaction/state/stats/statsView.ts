import { spriteRefs } from "../../../../asset/sprite.ts";
import { allSides } from "../../../../common/sides.ts";
import { defaultTextStyle, graySubTitleTextStyle, subTitleTextStyle } from "../../../../rendering/text/textStyle.ts";
import { createComponent } from "../../../../ui/declarative/ui.ts";
import { uiBookLayout } from "../../../../ui/declarative/uiBookLayout.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../ui/declarative/uiButton.ts";
import {
    CrossAxisAlignment,
    MainAxisAlignment,
    uiColumn,
    uiRow,
} from "../../../../ui/declarative/uiSequence.ts";
import { uiSpace } from "../../../../ui/declarative/uiSpace.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import type { ActiveEffectsComponent } from "../../../component/activeEffectsComponent.ts";
import { ActiveEffectsComponentId } from "../../../component/activeEffectsComponent.ts";
import type { Entity } from "../../../entity/entity.ts";
import { getStatBreakdown, getStats } from "../../../stat/getStats.ts";
import type { StatType } from "../../../stat/statType.ts";
import { statTypes } from "../../../stat/statType.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";

type StatsViewProps = {
    entity: Entity;
    selectedStat: StatType | null;
    onStatSelected: (stat: StatType) => void;
    onClose: () => void;
};

const statLabels: Record<StatType, string> = {
    might: "Might",
    wit: "Wit",
    presence: "Presence",
    valor: "Valor",
};

export const statsView = createComponent<StatsViewProps>(
    ({ props }) => {
        const resolved = getStats(props.entity);

        const leftPage = uiColumn({
            width: wrapUiSize,
            height: wrapUiSize,
            gap: 4,
            children: [
                uiText({
                    content: "Stats",
                    textStyle: subTitleTextStyle,
                    width: wrapUiSize,
                    height: wrapUiSize,
                }),
                uiSpace({ width: 0, height: 4 }),
                ...statTypes.map((stat) =>
                    uiButton({
                        width: fillUiSize,
                        height: wrapUiSize,
                        padding: 6,
                        onTap: () => props.onStatSelected(stat),
                        background:
                            props.selectedStat === stat
                                ? ninePatchBackground({
                                      sprite: spriteRefs.stone_slate_background_2x,
                                      sides: allSides(8),
                                  })
                                : undefined,
                        child: uiRow({
                            width: fillUiSize,
                            height: wrapUiSize,
                            mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.Center,
                            children: [
                                uiText({
                                    content: statLabels[stat],
                                    textStyle: defaultTextStyle,
                                    width: wrapUiSize,
                                    height: wrapUiSize,
                                }),
                                uiText({
                                    content: String(resolved[stat]),
                                    textStyle: defaultTextStyle,
                                    width: wrapUiSize,
                                    height: wrapUiSize,
                                }),
                            ],
                        }),
                    }),
                ),
                uiSpace({ width: 0, height: 8 }),
                ...buildEffectsList(props.entity),
            ],
        });

        const rightPage = buildRightPage(props);

        return uiScaffold({
            content: uiBookLayout({
                leftPage,
                rightPage,
            }),
            leftButtons: [
                {
                    text: "Close",
                    icon: spriteRefs.empty_sprite,
                    onClick: props.onClose,
                },
            ],
        });
    },
    { displayName: "StatsView" },
);

function buildEffectsList(entity: Entity) {
    const effectsComponent = entity.getEcsComponent(
        ActiveEffectsComponentId,
    ) as ActiveEffectsComponent | null;

    if (!effectsComponent || effectsComponent.effects.length === 0) {
        return [];
    }

    return [
        uiText({
            content: "Effects",
            textStyle: subTitleTextStyle,
            width: wrapUiSize,
            height: wrapUiSize,
        }),
        uiSpace({ width: 0, height: 4 }),
        ...effectsComponent.effects.map((activeEffect) => {
            const duration =
                activeEffect.effect.timing.type === "immediate"
                    ? "instant"
                    : `${activeEffect.remainingTicks}t`;

            return uiRow({
                width: fillUiSize,
                height: wrapUiSize,
                mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                crossAxisAlignment: CrossAxisAlignment.Center,
                children: [
                    uiText({
                        content: activeEffect.effect.name,
                        textStyle: defaultTextStyle,
                        width: wrapUiSize,
                        height: wrapUiSize,
                    }),
                    uiText({
                        content: duration,
                        textStyle: graySubTitleTextStyle,
                        width: wrapUiSize,
                        height: wrapUiSize,
                    }),
                ],
            });
        }),
    ];
}

function buildRightPage(props: StatsViewProps) {
    if (!props.selectedStat) {
        return uiBox({
            width: wrapUiSize,
            height: wrapUiSize,
            child: uiText({
                content: "Select a stat to see breakdown",
                textStyle: graySubTitleTextStyle,
                width: wrapUiSize,
                height: wrapUiSize,
            }),
        });
    }

    const stat = props.selectedStat;
    const resolved = getStats(props.entity);
    const contributors = getStatBreakdown(props.entity, stat);

    return uiColumn({
        width: wrapUiSize,
        height: wrapUiSize,
        gap: 4,
        children: [
            uiText({
                content: statLabels[stat],
                textStyle: subTitleTextStyle,
                width: wrapUiSize,
                height: wrapUiSize,
            }),
            uiSpace({ width: 0, height: 4 }),
            ...contributors.map((contributor) => {
                const parts: string[] = [];
                if (contributor.flat !== undefined) {
                    parts.push(
                        contributor.flat >= 0
                            ? `+${contributor.flat}`
                            : `${contributor.flat}`,
                    );
                }
                if (contributor.percent !== undefined) {
                    parts.push(`×${(1 + contributor.percent).toFixed(2)}`);
                }
                const valueText =
                    parts.length > 0 ? parts.join(" ") : String(contributor.flat ?? 0);

                return uiRow({
                    width: fillUiSize,
                    height: wrapUiSize,
                    mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.Center,
                    children: [
                        uiText({
                            content: contributor.label,
                            textStyle: defaultTextStyle,
                            width: wrapUiSize,
                            height: wrapUiSize,
                        }),
                        uiText({
                            content: valueText,
                            textStyle: defaultTextStyle,
                            width: wrapUiSize,
                            height: wrapUiSize,
                        }),
                    ],
                });
            }),
            uiSpace({ width: 0, height: 8 }),
            uiRow({
                width: fillUiSize,
                height: wrapUiSize,
                mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                crossAxisAlignment: CrossAxisAlignment.Center,
                children: [
                    uiText({
                        content: "Total",
                        textStyle: subTitleTextStyle,
                        width: wrapUiSize,
                        height: wrapUiSize,
                    }),
                    uiText({
                        content: String(resolved[stat]),
                        textStyle: subTitleTextStyle,
                        width: wrapUiSize,
                        height: wrapUiSize,
                    }),
                ],
            }),
        ],
    });
}
