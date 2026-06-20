import type { ComponentDescriptor } from "../ui/declarative/ui.ts";
import { addPoint, type Point } from "../common/point.ts";
import { clamp } from "../common/number.ts";
import type { RenderScope } from "../rendering/renderScope.ts";
import { DevApp } from "../devtools/devApp.ts";
import {
    createInitialState,
    maxEncompassBias,
    maxNoiseAmplitude,
    maxTargetSize,
    maxWallOffset,
    minEncompassBias,
    minNoiseAmplitude,
    minTargetSize,
    minWallOffset,
    type MountainPreviewState,
    type PaintMode,
} from "./mountainPreviewState.ts";
import { MountainPreviewUI } from "./mountainPreviewUI.ts";
import {
    chunkKey,
    generateBiomeShape,
    parseChunkKey,
} from "./biomeShapeSearch.ts";
import { restoreScenario, saveScenario } from "./mountainPreviewStorage.ts";
import { shapePresets, type ShapePresetName } from "./shapePresets.ts";
import { randomSeed } from "../common/randomSeed.ts";

/** On-screen size of one chunk square, in pixels. */
const CHUNK_PX = 40;

const GRID_LINE_COLOR = "#0d3320";
const GENERATED_FILL = "#6b6b73";
const GENERATED_STROKE = "#3c3c44";
const BLOCKED_FILL = "#b23a3a";
const BLOCKED_STROKE = "#5e1e1e";
const START_FILL = "rgba(230, 200, 60, 0.35)";
const START_STROKE = "#e6c83c";

/**
 * Dev app for modelling mountain biome shape generation. The developer paints a
 * start guide and blocking chunks on a pannable grid and tunes the shape; the
 * biome is grown by best-first cost-field expansion (see generateBiomeShape).
 * Parameter changes regenerate live; editing the scenario (paint/clear) clears
 * the result and waits for Start.
 */
export class MountainPreview extends DevApp {
    private state: MountainPreviewState;
    private mountainUI: MountainPreviewUI;
    private pointerDownHandledByUi = false;

    constructor(canvasElementId: string) {
        super(canvasElementId);

        this.state = createInitialState();
        // Restore a previously painted scenario so reloads (e.g. after
        // recompiling generation logic) keep the same canvas.
        restoreScenario(this.state);
        this.mountainUI = new MountainPreviewUI(this.state, {
            onSelectMode: (mode: PaintMode) => {
                this.state.mode = mode;
                this.persist();
            },
            onChangeTargetSize: (delta: number) => {
                this.state.targetSize = clamp(
                    this.state.targetSize + delta,
                    minTargetSize,
                    maxTargetSize,
                );
                this.rerun();
            },
            onStart: () => {
                this.runSearch();
                this.render();
            },
            onClear: () => {
                this.state.blocked.clear();
                this.state.generated = [];
                this.persist();
            },
            onSelectPreset: (preset: ShapePresetName) => {
                this.state.preset = preset;
                // Adopt the preset's noise as the new baseline so switching
                // presets feels clean; it stays tunable from there.
                this.state.noiseAmplitude = shapePresets[preset].noiseAmplitude;
                this.rerun();
            },
            onChangeNoise: (delta: number) => {
                this.state.noiseAmplitude = clamp(
                    this.state.noiseAmplitude + delta,
                    minNoiseAmplitude,
                    maxNoiseAmplitude,
                );
                this.rerun();
            },
            onChangeBias: (delta: number) => {
                this.state.encompassBias = clamp(
                    this.state.encompassBias + delta,
                    minEncompassBias,
                    maxEncompassBias,
                );
                this.rerun();
            },
            onChangeWallOffset: (delta: number) => {
                this.state.wallOffset = clamp(
                    this.state.wallOffset + delta,
                    minWallOffset,
                    maxWallOffset,
                );
                this.rerun();
            },
            onRandomizeSeed: () => {
                this.state.seed = randomSeed();
                this.rerun();
            },
        });

        this.wireInput();

        // Center the camera on the start chunk (0,0).
        this.camera.position = {
            x: Math.floor(CHUNK_PX / 2),
            y: Math.floor(CHUNK_PX / 2),
        };
    }

    protected override buildUI(): ComponentDescriptor | null {
        return this.mountainUI.build();
    }

    protected override drawCanvas(scope: RenderScope): void {
        this.drawGrid(scope);
        this.drawChunks(scope);
    }

    private wireInput(): void {
        this.touchInput.onTapDown = (position: Point) => {
            this.pointerDownHandledByUi =
                this.uiRenderer.onPointerDown(position);
            this.render();
            return this.pointerDownHandledByUi;
        };

        this.touchInput.onPan = (movement, position, _start, downHandled) => {
            this.uiRenderer.onPointerMove(position);
            // Only pan the world when the gesture did not start on the panel.
            if (!downHandled) {
                this.camera.translate({ x: -movement.x, y: -movement.y });
            }
            this.render();
        };

        this.touchInput.onTapEnd = (tapEndEvent) => {
            this.uiRenderer.onPointerUp(tapEndEvent.position);
            if (!this.pointerDownHandledByUi && !tapEndEvent.wasDragging) {
                this.paintAt(tapEndEvent.position);
            }
            this.pointerDownHandledByUi = false;
            this.render();
        };

        this.touchInput.onTapCancel = () => {
            this.uiRenderer.onPointerCancel();
            this.pointerDownHandledByUi = false;
            this.render();
        };
    }

    private paintAt(screenPosition: Point): void {
        const chunk = this.screenToChunk(screenPosition);
        if (this.state.mode === "start") {
            this.state.startChunk = chunk;
        } else {
            const key = chunkKey(chunk);
            if (this.state.blocked.has(key)) {
                this.state.blocked.delete(key);
            } else {
                this.state.blocked.add(key);
            }
        }
        // The painted layout changed, so any previous result is stale.
        this.state.generated = [];
        saveScenario(this.state);
    }

    /** Regenerate for a parameter change: re-run, persist and redraw. */
    private rerun(): void {
        this.runSearch();
        saveScenario(this.state);
        this.render();
    }

    /** Persist and redraw without regenerating (mode/clear changes). */
    private persist(): void {
        saveScenario(this.state);
        this.render();
    }

    private runSearch(): void {
        if (this.state.startChunk == null) {
            this.state.generated = [];
            return;
        }
        const start = this.state.startChunk;
        const preset = shapePresets[this.state.preset];
        const wells =
            preset.wellOffset != null
                ? [addPoint(start, preset.wellOffset)]
                : [];
        this.state.generated = generateBiomeShape({
            start,
            blocked: this.state.blocked,
            targetSize: this.state.targetSize,
            seed: this.state.seed,
            metric: preset.metric,
            anisotropy: preset.anisotropy,
            orientation: preset.orientation,
            noiseAmplitude: this.state.noiseAmplitude,
            noiseFrequency: preset.noiseFrequency,
            wells,
            encompassBias: this.state.encompassBias,
            wallOffset: this.state.wallOffset,
        });
    }

    private screenToChunk(screenPosition: Point): Point {
        const world = this.camera.screenToWorld(screenPosition);
        return {
            x: Math.floor(world.x / CHUNK_PX),
            y: Math.floor(world.y / CHUNK_PX),
        };
    }

    private visibleChunkBounds(scope: RenderScope): {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } {
        const topLeft = this.camera.screenToWorld({ x: 0, y: 0 });
        const bottomRight = this.camera.screenToWorld({
            x: scope.width,
            y: scope.height,
        });
        return {
            minX: Math.floor(topLeft.x / CHUNK_PX) - 1,
            minY: Math.floor(topLeft.y / CHUNK_PX) - 1,
            maxX: Math.ceil(bottomRight.x / CHUNK_PX) + 1,
            maxY: Math.ceil(bottomRight.y / CHUNK_PX) + 1,
        };
    }

    private drawGrid(scope: RenderScope): void {
        const bounds = this.visibleChunkBounds(scope);
        const top = this.camera.worldToScreenY(bounds.minY * CHUNK_PX);
        const bottom = this.camera.worldToScreenY(bounds.maxY * CHUNK_PX);
        const left = this.camera.worldToScreenX(bounds.minX * CHUNK_PX);
        const right = this.camera.worldToScreenX(bounds.maxX * CHUNK_PX);

        for (let cx = bounds.minX; cx <= bounds.maxX; cx++) {
            const x = this.camera.worldToScreenX(cx * CHUNK_PX);
            scope.drawLine(x, top, x, bottom, GRID_LINE_COLOR, 1);
        }
        for (let cy = bounds.minY; cy <= bounds.maxY; cy++) {
            const y = this.camera.worldToScreenY(cy * CHUNK_PX);
            scope.drawLine(left, y, right, y, GRID_LINE_COLOR, 1);
        }
    }

    private drawChunks(scope: RenderScope): void {
        for (const chunk of this.state.generated) {
            this.drawChunkSquare(
                scope,
                chunk,
                GENERATED_FILL,
                GENERATED_STROKE,
                1,
            );
        }

        for (const key of this.state.blocked) {
            const chunk = parseChunkKey(key);
            this.drawChunkSquare(
                scope,
                chunk,
                BLOCKED_FILL,
                BLOCKED_STROKE,
                1,
            );
        }

        if (this.state.startChunk != null) {
            this.drawChunkSquare(
                scope,
                this.state.startChunk,
                START_FILL,
                START_STROKE,
                3,
            );
        }
    }

    private drawChunkSquare(
        scope: RenderScope,
        chunk: Point,
        fill: string,
        strokeColor: string,
        strokeWidth: number,
    ): void {
        scope.drawRectangle({
            x: chunk.x * CHUNK_PX,
            y: chunk.y * CHUNK_PX,
            width: CHUNK_PX,
            height: CHUNK_PX,
            fill,
            strokeColor,
            strokeWidth,
        });
    }
}
