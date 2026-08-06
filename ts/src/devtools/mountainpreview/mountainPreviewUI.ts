import type { ComponentDescriptor } from "../../ui/declarative/ui.ts";
import { uiBox } from "../../ui/declarative/uiBox.ts";
import {
    CrossAxisAlignment,
    uiColumn,
    uiRow,
} from "../../ui/declarative/uiSequence.ts";
import { uiText } from "../../ui/declarative/uiText.ts";
import { uiButton } from "../../ui/declarative/uiButton.ts";
import { boxBackground, colorBackground } from "../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../ui/uiSize.ts";
import {
    subTitleTextStyle,
    titleTextStyle,
} from "../../rendering/text/textStyle.ts";
import type {
    MountainPreviewState,
    PaintMode,
} from "./mountainPreviewState.ts";
import { shapePresetNames, type ShapePresetName } from "./shapePresets.ts";
import {
    encompassBiasStep,
    noiseAmplitudeStep,
    wallOffsetStep,
} from "./mountainPreviewState.ts";

const PANEL_WIDTH = 330;
const SECTION_GAP = 8;
const BUTTON_HEIGHT = 40;
const BUTTON_GAP = 6;
const VALUE_WIDTH = 52;
const RANDOMIZE_WIDTH = 120;

const PANEL_BACKGROUND = "rgba(15,15,15,0.95)";
const BUTTON_DEFAULT = "#2c2c2c";
const BUTTON_SELECTED = "#4f6fb0";
const BUTTON_PRESSED = "#1c1c1c";
const BUTTON_BORDER = "#555555";
const ACTION_START = "#3f7d3f";
const ACTION_CLEAR = "#7d3f3f";

export type MountainPreviewCallbacks = {
    onSelectMode: (mode: PaintMode) => void;
    onChangeTargetSize: (delta: number) => void;
    onStart: () => void;
    onClear: () => void;
    onSelectPreset: (preset: ShapePresetName) => void;
    onChangeNoise: (delta: number) => void;
    onChangeBias: (delta: number) => void;
    onChangeWallOffset: (delta: number) => void;
    onRandomizeSeed: () => void;
};

const PRESET_LABELS: Record<ShapePresetName, string> = {
    round: "Round",
    square: "Square",
    long: "Long",
    blobby: "Blobby",
    peanut: "Peanut",
};

/**
 * Right-side control panel for the mountain biome preview. Compact layout: the
 * paint-mode toggle and shape presets are button rows, the four tunables (size,
 * noise, wrap bias, wall push) are inline-labelled stepper rows, and seed,
 * run/clear and the status readout share rows. Rebuilt from state every frame.
 */
export class MountainPreviewUI {
    private state: MountainPreviewState;
    private callbacks: MountainPreviewCallbacks;

    constructor(
        state: MountainPreviewState,
        callbacks: MountainPreviewCallbacks,
    ) {
        this.state = state;
        this.callbacks = callbacks;
    }

    setState(state: MountainPreviewState): void {
        this.state = state;
    }

    build(): ComponentDescriptor | null {
        const panel = uiBox({
            width: PANEL_WIDTH,
            height: fillUiSize,
            background: colorBackground(PANEL_BACKGROUND),
            padding: 16,
            alignment: { x: 0, y: 0 },
            child: uiColumn({
                width: fillUiSize,
                height: wrapUiSize,
                gap: SECTION_GAP,
                children: [
                    uiText({
                        content: "Mountain Biome",
                        textStyle: titleTextStyle,
                        width: fillUiSize,
                    }),
                    this.buildModeRow(),
                    this.buildShapeRows(),
                    this.buildStepperRow(
                        "Size",
                        `${this.state.targetSize}`,
                        "target",
                        () => this.callbacks.onChangeTargetSize(-1),
                        () => this.callbacks.onChangeTargetSize(1),
                    ),
                    this.buildStepperRow(
                        "Noise",
                        this.state.noiseAmplitude.toFixed(1),
                        "noise",
                        () => this.callbacks.onChangeNoise(-noiseAmplitudeStep),
                        () => this.callbacks.onChangeNoise(noiseAmplitudeStep),
                    ),
                    this.buildStepperRow(
                        "Wrap bias",
                        this.state.encompassBias.toFixed(1),
                        "bias",
                        () => this.callbacks.onChangeBias(-encompassBiasStep),
                        () => this.callbacks.onChangeBias(encompassBiasStep),
                    ),
                    this.buildStepperRow(
                        "Wall offset",
                        this.state.wallOffset.toFixed(1),
                        "wall-offset",
                        () =>
                            this.callbacks.onChangeWallOffset(-wallOffsetStep),
                        () => this.callbacks.onChangeWallOffset(wallOffsetStep),
                    ),
                    this.buildSeedRow(),
                    this.buildActionsRow(),
                    this.buildStatus(),
                ],
            }),
        });

        return uiRow({
            width: fillUiSize,
            height: fillUiSize,
            children: [uiBox({ width: fillUiSize, height: fillUiSize }), panel],
        });
    }

    private buildModeRow(): ComponentDescriptor {
        return uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: BUTTON_GAP,
            children: [
                this.buildModeButton("Start chunk", "start"),
                this.buildModeButton("Blocking", "blocking"),
            ],
        });
    }

    private buildModeButton(
        label: string,
        mode: PaintMode,
    ): ComponentDescriptor {
        const selected = this.state.mode === mode;
        return uiButton({
            width: fillUiSize,
            height: BUTTON_HEIGHT,
            background: boxBackground({
                fill: selected ? BUTTON_SELECTED : BUTTON_DEFAULT,
                stroke: BUTTON_BORDER,
                strokeWidth: 2,
            }),
            pressedBackground: boxBackground({
                fill: BUTTON_PRESSED,
                stroke: BUTTON_BORDER,
                strokeWidth: 2,
            }),
            child: uiText({ content: label, textStyle: subTitleTextStyle }),
            onTap: () => this.callbacks.onSelectMode(mode),
            key: `mode-${mode}`,
        });
    }

    private buildShapeRows(): ComponentDescriptor {
        return uiColumn({
            width: fillUiSize,
            height: wrapUiSize,
            gap: BUTTON_GAP,
            children: [
                uiRow({
                    width: fillUiSize,
                    height: wrapUiSize,
                    gap: BUTTON_GAP,
                    children: shapePresetNames
                        .slice(0, 3)
                        .map((preset) => this.buildPresetButton(preset)),
                }),
                uiRow({
                    width: fillUiSize,
                    height: wrapUiSize,
                    gap: BUTTON_GAP,
                    children: shapePresetNames
                        .slice(3)
                        .map((preset) => this.buildPresetButton(preset)),
                }),
            ],
        });
    }

    private buildPresetButton(preset: ShapePresetName): ComponentDescriptor {
        const selected = this.state.preset === preset;
        return uiButton({
            width: fillUiSize,
            height: BUTTON_HEIGHT,
            background: boxBackground({
                fill: selected ? BUTTON_SELECTED : BUTTON_DEFAULT,
                stroke: BUTTON_BORDER,
                strokeWidth: 2,
            }),
            pressedBackground: boxBackground({
                fill: BUTTON_PRESSED,
                stroke: BUTTON_BORDER,
                strokeWidth: 2,
            }),
            child: uiText({
                content: PRESET_LABELS[preset],
                textStyle: subTitleTextStyle,
            }),
            onTap: () => this.callbacks.onSelectPreset(preset),
            key: `preset-${preset}`,
        });
    }

    private buildStepperRow(
        label: string,
        value: string,
        keyBase: string,
        onDecrease: () => void,
        onIncrease: () => void,
    ): ComponentDescriptor {
        return uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: BUTTON_GAP,
            crossAxisAlignment: CrossAxisAlignment.Center,
            children: [
                uiText({
                    content: label,
                    textStyle: subTitleTextStyle,
                    width: fillUiSize,
                }),
                this.buildSquareButton("-", `${keyBase}-dec`, onDecrease),
                this.buildValueDisplay(value),
                this.buildSquareButton("+", `${keyBase}-inc`, onIncrease),
            ],
        });
    }

    private buildSeedRow(): ComponentDescriptor {
        return uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: BUTTON_GAP,
            crossAxisAlignment: CrossAxisAlignment.Center,
            children: [
                uiText({
                    content: `Seed: ${this.state.seed}`,
                    textStyle: subTitleTextStyle,
                    width: fillUiSize,
                }),
                this.buildActionButton(
                    "Randomize",
                    BUTTON_DEFAULT,
                    () => this.callbacks.onRandomizeSeed(),
                    RANDOMIZE_WIDTH,
                ),
            ],
        });
    }

    private buildActionsRow(): ComponentDescriptor {
        return uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: BUTTON_GAP,
            children: [
                this.buildActionButton("Start", ACTION_START, () =>
                    this.callbacks.onStart(),
                ),
                this.buildActionButton("Clear", ACTION_CLEAR, () =>
                    this.callbacks.onClear(),
                ),
            ],
        });
    }

    private buildValueDisplay(content: string): ComponentDescriptor {
        return uiBox({
            width: VALUE_WIDTH,
            height: BUTTON_HEIGHT,
            child: uiText({ content, textStyle: titleTextStyle }),
        });
    }

    private buildSquareButton(
        label: string,
        key: string,
        onTap: () => void,
    ): ComponentDescriptor {
        return uiButton({
            width: BUTTON_HEIGHT,
            height: BUTTON_HEIGHT,
            background: boxBackground({
                fill: BUTTON_DEFAULT,
                stroke: BUTTON_BORDER,
                strokeWidth: 2,
            }),
            pressedBackground: boxBackground({
                fill: BUTTON_PRESSED,
                stroke: BUTTON_BORDER,
                strokeWidth: 2,
            }),
            child: uiText({ content: label, textStyle: titleTextStyle }),
            onTap,
            key,
        });
    }

    private buildActionButton(
        label: string,
        fill: string,
        onTap: () => void,
        width: number = fillUiSize,
    ): ComponentDescriptor {
        return uiButton({
            width,
            height: BUTTON_HEIGHT,
            background: boxBackground({
                fill,
                stroke: BUTTON_BORDER,
                strokeWidth: 2,
            }),
            pressedBackground: boxBackground({
                fill: BUTTON_PRESSED,
                stroke: BUTTON_BORDER,
                strokeWidth: 2,
            }),
            child: uiText({ content: label, textStyle: subTitleTextStyle }),
            onTap,
            key: `action-${label}`,
        });
    }

    private buildStatus(): ComponentDescriptor {
        const generatedCount = this.state.generated.length;
        const blockedCount = this.state.blocked.size;
        return uiText({
            content: `Gen ${generatedCount}/${this.state.targetSize} · Block ${blockedCount}`,
            textStyle: subTitleTextStyle,
            width: fillUiSize,
        });
    }
}
