import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../src/game/component/tileComponent.ts";
import { getTileId } from "../../../../src/game/map/tile.ts";
import {
    createKingdomComponent,
    KingdomType,
} from "../../../../src/game/component/kingdomComponent.ts";
import { ChunkSize } from "../../../../src/game/map/chunk.ts";
import type { Volume } from "../../../../src/game/map/volume.ts";
import type { Point } from "../../../../src/common/point.ts";

let entityCounter = 0;
let volumeCounter = 0;

function nextEntityId(): string {
    return `kingdom${++entityCounter}`;
}

function nextVolumeId(): string {
    return `volume${++volumeCounter}`;
}

export class KingdomSpawnTestHarness {
    private _root: Entity;
    private _tileComponent: ReturnType<typeof createTileComponent>;

    constructor() {
        this._root = new Entity("root");
        this._tileComponent = createTileComponent();
        this._root.setEcsComponent(this._tileComponent);
    }

    get root(): Entity {
        return this._root;
    }

    addChunk(chunkX: number, chunkY: number, volume?: Volume): void {
        setChunk(this._tileComponent, { chunkX, chunkY, volume });
    }

    createVolume(
        type: Volume["type"],
        maxSize: number,
        isStartBiome?: boolean,
    ): Volume {
        return {
            id: nextVolumeId(),
            type,
            maxSize,
            chunks: [],
            debugColor: "#000000",
            isStartBiome,
        };
    }

    /**
     * Places a scaffolded kingdom entity at the given chunk position.
     * addChild is called before setting worldPosition per the ECS convention.
     */
    placeKingdom(
        chunkPos: Point,
        type: KingdomType,
        foundedAtTick: number = 0,
    ): Entity {
        const entity = new Entity(nextEntityId());
        entity.setEcsComponent(createKingdomComponent(type, foundedAtTick));
        this._root.addChild(entity);
        entity.worldPosition = {
            x: chunkPos.x * ChunkSize,
            y: chunkPos.y * ChunkSize,
        };
        return entity;
    }

    buildChunkLine(
        startX: number,
        startY: number,
        length: number,
        direction: "horizontal" | "vertical",
        volume?: Volume,
    ): void {
        for (let i = 0; i < length; i++) {
            const x = direction === "horizontal" ? startX + i : startX;
            const y = direction === "vertical" ? startY + i : startY;
            this.addChunk(x, y, volume);
        }
    }

    getVolumeAtChunk(chunkX: number, chunkY: number): Volume | undefined {
        return this._tileComponent.chunks.get(
            getTileId(chunkX, chunkY),
        )?.volume;
    }

    buildChunkGrid(
        startX: number,
        startY: number,
        width: number,
        height: number,
        volume?: Volume,
    ): void {
        for (let x = startX; x < startX + width; x++) {
            for (let y = startY; y < startY + height; y++) {
                this.addChunk(x, y, volume);
            }
        }
    }
}
