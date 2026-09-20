import { log } from "../../common/logging/logger.ts";
import type { Point } from "../../common/point.ts";
import { animalsForBiome } from "../../data/animal/animals.ts";
import type { Animal } from "../../data/animal/animal.ts";
import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { AnimalComponentId } from "../component/animalComponent.ts";
import {
    ChunkMapComponentId,
    getEntitiesInChunk,
    type ChunkMap,
} from "../component/chunkMapComponent.ts";
import { TileComponentId } from "../component/tileComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { generateSpawnPoints } from "../map/item/vegetation.ts";
import { animalPrefab } from "../prefab/animalPrefab.ts";

/**
 * Chance per tick that an empty chunk gets its animal back. A chunk holds one
 * animal at a time, so this is what stands between a hunter and an endless
 * supply of meat on the same tile: kill the boar and the woods need roughly a
 * minute before another wanders in.
 */
export const ANIMAL_SPAWN_CHANCE = 0.02;

/**
 * Keeps wildlife in the world. Every chunk of every volume holds at most one
 * animal, and which animals may appear comes from the volume's biome, so a
 * camel stays in the desert and the swamp gets boar.
 *
 * The random source is a parameter so a test can force or deny a spawn instead
 * of ticking until one happens.
 */
export function createAnimalSystem(
    random: () => number = Math.random,
): EcsSystem {
    return {
        onUpdate: (root: Entity) => {
            const volumes = root
                .requireEcsComponent(TileComponentId)
                .volume.values();

            const chunkMap =
                root.requireEcsComponent(ChunkMapComponentId).chunkMap;

            for (const volume of volumes) {
                const nativeAnimals = animalsForBiome(volume.type);
                if (nativeAnimals.length === 0) {
                    continue;
                }

                for (const chunk of volume.chunks) {
                    if (chunkHasAnimal(chunkMap, chunk)) {
                        continue;
                    }

                    if (random() >= ANIMAL_SPAWN_CHANCE) {
                        continue;
                    }

                    spawnAnimal(root, chunkMap, chunk, nativeAnimals, random);
                }
            }
        },
    };
}

function chunkHasAnimal(chunkMap: ChunkMap, chunk: Point): boolean {
    for (const entity of getEntitiesInChunk(chunkMap, chunk)) {
        if (entity.hasComponent(AnimalComponentId)) {
            return true;
        }
    }
    return false;
}

/**
 * Puts one of the biome's animals on a free tile in the chunk. A chunk with no
 * room left is skipped rather than stacking an animal on top of a tree.
 */
function spawnAnimal(
    root: Entity,
    chunkMap: ChunkMap,
    chunk: Point,
    nativeAnimals: readonly Animal[],
    random: () => number,
): void {
    const [spawnPosition] = generateSpawnPoints(1, chunk, chunkMap);
    if (!spawnPosition) {
        return;
    }

    const animal = nativeAnimals[Math.floor(random() * nativeAnimals.length)];
    const entity = animalPrefab(animal);
    root.addChild(entity);
    entity.worldPosition = spawnPosition;

    log.info("Spawned animal", {
        animalId: animal.id,
        entityId: entity.id,
        position: spawnPosition,
    });
}
