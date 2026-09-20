import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../src/common/point.ts";
import {
    findAttackableEntity,
    resolveTargets,
} from "../../../src/game/combat/resolveTarget.ts";
import { createHealthComponent } from "../../../src/game/component/healthComponent.ts";
import { createSpriteComponent } from "../../../src/game/component/spriteComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { spriteRefs } from "../../../src/asset/sprite.ts";
import { createMinimalWorld } from "../testWorld.ts";
import { AttackTargetKind } from "../../../src/data/combat/attackProfileDefinition.ts";
import { testAttackProfile } from "./testAttackProfile.ts";

const tile: Point = { x: 13, y: 9 };

/**
 * A sprite is what puts an entity in the chunk map, and a tile query reads the
 * chunk map. Without one it is standing nowhere
 */
function addStander(
    root: Entity,
    id: string,
    position: Point,
    hp: number | null,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(spriteRefs.empty_sprite));
    if (hp !== null) {
        entity.setEcsComponent(createHealthComponent(hp, hp));
    }
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

describe("resolveTargets", () => {
    describe("an entity target", () => {
        it("names the entity aimed at", () => {
            const { root } = createMinimalWorld();
            const goblin = addStander(root, "goblin", tile, 10);

            const targets = resolveTargets(
                root,
                { kind: AttackTargetKind.Entity, id: "goblin" },
                tile,
            );

            assert.deepStrictEqual(targets, [goblin]);
        });

        it("finds nobody in something that cannot be hurt", () => {
            const { root } = createMinimalWorld();
            addStander(root, "signpost", tile, null);

            const targets = resolveTargets(
                root,
                { kind: AttackTargetKind.Entity, id: "signpost" },
                tile,
            );

            assert.deepStrictEqual(
                targets,
                [],
                "a blow that cannot hurt its target has found nothing to hit",
            );
        });
    });

    describe("a tile target", () => {
        it("takes whoever is standing there", () => {
            const { root } = createMinimalWorld();
            const goblin = addStander(root, "goblin", tile, 10);

            const targets = resolveTargets(
                root,
                { kind: AttackTargetKind.Tile, point: tile },
                tile,
            );

            assert.deepStrictEqual(targets, [goblin]);
        });

        it("ignores whatever on the tile has no health to lose", () => {
            const { root } = createMinimalWorld();
            addStander(root, "signpost", tile, null);
            const goblin = addStander(root, "goblin", tile, 10);

            const targets = resolveTargets(
                root,
                { kind: AttackTargetKind.Tile, point: tile },
                tile,
            );

            assert.deepStrictEqual(targets, [goblin]);
        });
    });
});

describe("findAttackableEntity", () => {
    it("names a target far outside the weapon's reach", () => {
        const { root } = createMinimalWorld();
        const distant: Point = { x: 44, y: 37 };
        const goblin = addStander(root, "goblin", distant, 10);

        const found = findAttackableEntity(
            root,
            testAttackProfile({ range: 1 }),
            distant,
        );

        assert.strictEqual(
            found,
            goblin,
            "reach decides where the attacker has to stand, not what it may be ordered to attack",
        );
    });

    it("ignores whatever on the tile has no health to lose", () => {
        const { root } = createMinimalWorld();
        addStander(root, "signpost", tile, null);
        const goblin = addStander(root, "goblin", tile, 10);

        const found = findAttackableEntity(root, testAttackProfile(), tile);

        assert.strictEqual(found, goblin);
    });

    it("finds nothing on an empty tile", () => {
        const { root } = createMinimalWorld();

        const found = findAttackableEntity(root, testAttackProfile(), tile);

        assert.strictEqual(found, null);
    });

    it("finds nothing for an attack that cannot be aimed at entities", () => {
        const { root } = createMinimalWorld();
        addStander(root, "goblin", tile, 10);

        const found = findAttackableEntity(
            root,
            testAttackProfile({ targets: [AttackTargetKind.Tile] }),
            tile,
        );

        assert.strictEqual(found, null);
    });
});
