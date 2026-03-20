import type { ComponentDescriptor } from "../ui/declarative/ui.ts";
import { uiBox } from "../ui/declarative/uiBox.ts";
import { uiColumn, uiRow } from "../ui/declarative/uiSequence.ts";
import { uiText } from "../ui/declarative/uiText.ts";
import { colorBackground } from "../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../ui/uiSize.ts";
import {
    subTitleTextStyle,
    titleTextStyle,
} from "../rendering/text/textStyle.ts";
import type { BiomeType } from "../game/map/biome.ts";
import type { CityPreviewState } from "./cityPreviewState.ts";
import { createBiomeSelector } from "./ui/biomeSelector.ts";
import { createBuildLog } from "./ui/buildLog.ts";
import { createStateDisplay } from "./ui/stateDisplay.ts";
import { createTickControlBar } from "./ui/tickControlBar.ts";
import { COLORS, LAYOUT } from "./ui/cityPreviewConstants.ts";

export type CityPreviewCallbacks = {
    onAdvance: (ticks: number) => void;
    onReset: () => void;
    onBiomeChange: (biome: BiomeType) => void;
    onFateChange: (fate: string) => void;
    onSeedChange: (seed: number) => void;
};

export class CityPreviewUI {
    private state: CityPreviewState;
    private callbacks: CityPreviewCallbacks;

    constructor(state: CityPreviewState, callbacks: CityPreviewCallbacks) {
        this.state = state;
        this.callbacks = callbacks;
    }

    setState(state: CityPreviewState): void {
        this.state = state;
    }

    build(): ComponentDescriptor | null {
        const panelWidth = LAYOUT.PANEL_WIDTH;

        const rightPanel = uiBox({
            width: panelWidth,
            height: fillUiSize,
            background: colorBackground(COLORS.BACKGROUND_PANEL),
            child: uiColumn({
                width: panelWidth,
                height: wrapUiSize,
                gap: LAYOUT.SECTION_GAP,
                children: [
                    uiText({
                        content: "City Preview",
                        textStyle: titleTextStyle,
                        width: panelWidth,
                    }),
                    uiText({
                        content: "Biome",
                        textStyle: subTitleTextStyle,
                        width: panelWidth,
                    }),
                    createBiomeSelector(
                        this.state.biome,
                        this.callbacks.onBiomeChange,
                        panelWidth,
                    ),
                    createStateDisplay(this.state, panelWidth),
                    uiText({
                        content: "Log",
                        textStyle: subTitleTextStyle,
                        width: panelWidth,
                    }),
                    createBuildLog(this.state.log, panelWidth),
                ],
            }),
        });

        const canvasArea = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const mainRow = uiRow({
            width: fillUiSize,
            height: fillUiSize,
            children: [canvasArea, rightPanel],
        });

        const tickBar = uiBox({
            width: fillUiSize,
            height: LAYOUT.TICK_BAR_HEIGHT,
            background: colorBackground(COLORS.BACKGROUND_DARK),
            child: createTickControlBar(
                this.callbacks,
                window.innerWidth - panelWidth,
            ),
        });

        return uiColumn({
            width: fillUiSize,
            height: fillUiSize,
            children: [mainRow, tickBar],
        });
    }
}
