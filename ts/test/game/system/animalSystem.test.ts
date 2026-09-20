import assert from "node:assert";
import { describe, it } from "node:test";
import { getAnimal } from "../../../src/data/animal/animals.ts";
import { AnimalComponentId } from "../../../src/game/component/animalComponent.ts";
import { TileComponentId } from "../../../src/game/component/tileComponent.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import { createAnimalSystem } from "../../../src/game/system/animalSystem.ts";
import { createMinimalWorld } from "../testWorld.ts";

/**
 * A world of one desert chunk, with the volume told which chunk it owns.
 * createMinimalWorld leaves volume membership empty, and the spawner walks it.
 */
function desertWorld() {
    const world = createMinimalWorld({ minChunk: 1, maxChunk: 3 }, "desert");
    const [volume] = [
        ...world.root.requireEcsComponent(TileComponentId).volume.values(),
    ];
    volume.chunks.push({ x: 2, y: 1 });
    return world;
}

function animalsIn(root: Entity): string[] {
    return [...root.queryComponents(AnimalComponentId)].map(
        ([, component]) => component.animalId,
    );
}

describe("animalSystem", () => {
    it("spawns an animal native to the volume's biome", () => {
        const { root, world } = desertWorld();
        world.addSystem(createAnimalSystem(() => 0));

        world.runUpdate(1);

        const spawned = animalsIn(root);
        assert.strictEqual(spawned.length, 1);
        const animal = getAnimal(spawned[0]);
        assert.ok(
            animal?.biomes.includes("desert"),
            `${spawned[0]} does not belong in the desert`,
        );
    });

    it("leaves a chunk alone once it holds an animal", () => {
        const { root, world } = desertWorld();
        world.addSystem(createAnimalSystem(() => 0));

        world.runUpdate(1);
        world.runUpdate(2);
        world.runUpdate(3);

        assert.strictEqual(animalsIn(root).length, 1);
    });

    it("does not spawn when the roll misses the spawn chance", () => {
        const { root, world } = desertWorld();
        world.addSystem(createAnimalSystem(() => 0.99));

        world.runUpdate(1);

        assert.strictEqual(animalsIn(root).length, 0);
    });
});
