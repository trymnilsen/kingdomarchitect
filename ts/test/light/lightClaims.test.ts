import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import { encodePosition, type Point } from "../../src/common/point.ts";
import type { Phase } from "../../src/game/component/dayComponent.ts";
import { createLightSourceComponent } from "../../src/game/component/lightSourceComponent.ts";
import { createPlayerKingdomComponent } from "../../src/game/component/playerKingdomComponent.ts";
import { createGoblinCampComponent } from "../../src/game/component/goblinCampComponent.ts";
import {
    ambientIsLight,
    collectLightClaims,
    computeLitTiles,
    isTileLit,
} from "../../src/game/light/lightClaims.ts";

function addSource(
    parent: Entity,
    id: string,
    sourceId: string,
    position: Point,
    claimsHearthlight: boolean,
    pattern: Point[] | null = null,
): Entity {
    const source = new Entity(id);
    parent.addChild(source);
    source.setEcsComponent(
        createLightSourceComponent(sourceId, claimsHearthlight, pattern),
    );
    // worldPosition must be set after addChild so the parent transform applies.
    source.worldPosition = position;
    return source;
}

function litAt(litTiles: ReadonlySet<number>, x: number, y: number): boolean {
    return litTiles.has(encodePosition(x, y));
}

describe("lit coverage", () => {
    it("stamps a disc by squared euclidean distance at its radius edge", () => {
        const root = new Entity("root");
        addSource(root, "b", "lampPost", { x: 12, y: 8 }, true);

        const lit = computeLitTiles(collectLightClaims(root, "illumination"));

        // Radius 4: distance 4 along an axis is lit, 5 is not.
        assert.strictEqual(litAt(lit, 16, 8), true);
        assert.strictEqual(litAt(lit, 17, 8), false);
        // Diagonal offset (3,3) has squared distance 18 > 16 and is dark,
        // while (2,3) at 13 <= 16 is lit. A Manhattan or Chebyshev stamp
        // would get one of these wrong.
        assert.strictEqual(litAt(lit, 15, 11), false);
        assert.strictEqual(litAt(lit, 14, 11), true);
    });

    it("lights exactly the emitter's own tile at radius 0", () => {
        const root = new Entity("root");
        addSource(root, "w", "workerGlow", { x: 12, y: 8 }, false);

        const lit = computeLitTiles(collectLightClaims(root, "illumination"));

        assert.strictEqual(litAt(lit, 12, 8), true);
        assert.strictEqual(litAt(lit, 13, 8), false);
        assert.strictEqual(litAt(lit, 12, 9), false);
        assert.strictEqual(lit.size, 1);
    });

    it("stamps a pattern claim's offsets verbatim, ignoring the radius", () => {
        const root = new Entity("root");
        addSource(root, "s", "searchlight", { x: 12, y: 8 }, true, [
            { x: 2, y: 0 },
            { x: 3, y: 1 },
        ]);

        const lit = computeLitTiles(collectLightClaims(root, "illumination"));

        assert.strictEqual(litAt(lit, 14, 8), true);
        assert.strictEqual(litAt(lit, 15, 9), true);
        // The emitter's own tile is not in the pattern, so it is not lit.
        assert.strictEqual(litAt(lit, 12, 8), false);
        assert.strictEqual(lit.size, 2);
    });

    it("scopes hearthlight to player-owned emitters carrying a claim", () => {
        const root = new Entity("root");

        const kingdom = new Entity("kingdom");
        kingdom.setEcsComponent(createPlayerKingdomComponent());
        root.addChild(kingdom);

        const camp = new Entity("camp");
        camp.setEcsComponent(createGoblinCampComponent(2));
        root.addChild(camp);

        // A cresset pool and a house's glow claim alike. A worker's glow is
        // created without a claim. The goblin hut claims, for its own camp.
        addSource(kingdom, "cresset", "cresset", { x: 12, y: 8 }, true);
        addSource(kingdom, "house", "buildingGlow", { x: 24, y: 8 }, true);
        addSource(kingdom, "glow", "workerGlow", { x: 20, y: 8 }, false);
        addSource(camp, "hut", "buildingGlow", { x: 30, y: 8 }, true);
        // A player tower's searchlight pattern claims by the same path as discs.
        addSource(kingdom, "beam", "searchlight", { x: 16, y: 16 }, true, [
            { x: 1, y: 0 },
        ]);

        const hearth = computeLitTiles(collectLightClaims(root, "hearthlight"));

        assert.strictEqual(litAt(hearth, 12, 8), true, "cresset claims");
        assert.strictEqual(litAt(hearth, 24, 8), true, "house glow claims");
        assert.strictEqual(litAt(hearth, 17, 16), true, "beam pattern claims");
        assert.strictEqual(
            litAt(hearth, 20, 8),
            false,
            "workerGlow never claims",
        );
        assert.strictEqual(
            litAt(hearth, 30, 8),
            false,
            "goblin hut is not ours",
        );

        // The illumination scope still sees all of them.
        const lit = computeLitTiles(collectLightClaims(root, "illumination"));
        assert.strictEqual(litAt(lit, 20, 8), true);
        assert.strictEqual(litAt(lit, 24, 8), true);
        assert.strictEqual(litAt(lit, 30, 8), true);
    });

    it("treats every phase except night as ambient light", () => {
        const expectations: Array<{ phase: Phase; ambient: boolean }> = [
            { phase: "dawn", ambient: true },
            { phase: "day", ambient: true },
            { phase: "dusk", ambient: true },
            { phase: "night", ambient: false },
        ];
        const empty = new Set<number>();
        for (const { phase, ambient } of expectations) {
            assert.strictEqual(ambientIsLight(phase), ambient, phase);
            // isTileLit short-circuits on ambient without consulting the set.
            assert.strictEqual(
                isTileLit(empty, phase, { x: 12, y: 8 }),
                ambient,
                `isTileLit at ${phase}`,
            );
        }
    });

    it("answers set membership at night through isTileLit", () => {
        const root = new Entity("root");
        addSource(root, "t", "wayshrine", { x: 12, y: 8 }, true);
        const lit = computeLitTiles(collectLightClaims(root, "illumination"));

        // Radius 1: the cardinal neighbour is lit, the diagonal is not.
        assert.strictEqual(isTileLit(lit, "night", { x: 13, y: 8 }), true);
        assert.strictEqual(isTileLit(lit, "night", { x: 13, y: 9 }), false);
    });
});
