import assert from "node:assert";
import { describe, it } from "node:test";
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
    it("leaves a chunk alone once it holds an animal", () => {
        const { root, world } = desertWorld();
        world.addSystem(createAnimalSystem(() => 0));

        world.runUpdate(1);
        world.runUpdate(2);
        world.runUpdate(3);

        assert.strictEqual(animalsIn(root).length, 1);
    });
});
