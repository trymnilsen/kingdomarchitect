import { generateId } from "../common/idGenerator.ts";
import { makeNumberId } from "../common/point.ts";
import { Entity } from "../game/entity/entity.ts";
import {
    createTileComponent,
    setChunk,
} from "../game/component/tileComponent.ts";
import {
    createVisibilityMapComponent,
} from "../game/component/visibilityMapComponent.ts";
import { type TileChunk } from "../game/map/chunk.ts";
import type { BiomeType } from "../game/map/biome.ts";
import type { Volume } from "../game/map/volume.ts";

export type CityPreviewState = {
    root: Entity;
    biome: BiomeType;
    seed: number;
    fate: string;
    currentTick: number;
    log: string[];
};

export function createInitialState(
    biome: BiomeType,
    seed: number,
): CityPreviewState {
    const root = new Entity("cityPreviewRoot");
    root.toggleIsGameRoot(true);

    const tiles = createTileComponent();
    root.setEcsComponent(tiles);

    const visibilityMap = createVisibilityMapComponent();
    root.setEcsComponent(visibilityMap);

    const volume: Volume = {
        id: generateId("volume"),
        type: biome,
        maxSize: 1,
        chunks: [{ x: 0, y: 0 }],
        debugColor: "#888888",
    };
    const chunk: TileChunk = { chunkX: 0, chunkY: 0, volume };
    setChunk(tiles, chunk);
    visibilityMap.discovered.fullyDiscoveredChunks.add(makeNumberId(0, 0));

    return {
        root,
        biome,
        seed,
        fate: "none",
        currentTick: 0,
        log: [],
    };
}
