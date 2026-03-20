import type { ComponentDescriptor } from "../ui/declarative/ui.ts";
import { Entity } from "../game/entity/entity.ts";
import { DevApp } from "../devtools/devApp.ts";
import { TileSize } from "../game/map/tile.ts";
import type { BiomeType } from "../game/map/biome.ts";
import {
    createInitialState,
    type CityPreviewState,
} from "./cityPreviewState.ts";
import { simulateTick } from "./cityPreviewSimulation.ts";
import { CityPreviewUI } from "./cityPreviewUI.ts";

/**
 * City builder preview dev app.
 * Renders a tile grid and lets the developer step through simulation ticks,
 * watching the kingdom generation evolve chunk by chunk.
 */
export class CityPreview extends DevApp {
    private state: CityPreviewState;
    private cityUI: CityPreviewUI;

    constructor(canvasElementId: string) {
        super(canvasElementId);

        // Enable debug chunk rendering so all tiles are visible without fog-of-war
        (window as any).debugChunks = true;

        this.state = createInitialState("plains", 42);
        this.cityUI = new CityPreviewUI(this.state, {
            onAdvance: (ticks) => {
                for (let i = 0; i < ticks; i++) {
                    simulateTick(this.state);
                }
                this.render();
            },
            onReset: () => {
                this.state = createInitialState(
                    this.state.biome,
                    this.state.seed,
                );
                this.cityUI.setState(this.state);
                this.render();
            },
            onBiomeChange: (biome: BiomeType) => {
                this.state = createInitialState(biome, this.state.seed);
                this.cityUI.setState(this.state);
                this.render();
            },
            onFateChange: (fate: string) => {
                this.state.fate = fate;
                this.render();
            },
            onSeedChange: (seed: number) => {
                this.state = createInitialState(this.state.biome, seed);
                this.cityUI.setState(this.state);
                this.render();
            },
        });

        // Pan: movement is in screen pixels, camera.position is in world pixels — 1:1 mapping.
        // Negate because dragging right reveals tiles to the left (camera moves left).
        this.touchInput.onPan = (movement) => {
            this.camera.translate({
                x: -movement.x,
                y: -movement.y,
            });
            this.render();
        };

        // Center camera on the single chunk (0,0): tile (4,4) = world (128,128).
        this.camera.position = { x: 4 * TileSize, y: 4 * TileSize };
    }

    protected override buildUI(): ComponentDescriptor | null {
        return this.cityUI.build();
    }

    protected override getScene(): Entity | null {
        return this.state.root;
    }
}
