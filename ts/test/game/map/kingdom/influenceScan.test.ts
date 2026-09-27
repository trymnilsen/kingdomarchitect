import { describe, it } from "node:test";
import assert from "node:assert";
import { computeInfluenceAtChunk } from "../../../../src/game/map/kingdom/influenceScan.ts";
import { KingdomType } from "../../../../src/game/component/kingdomComponent.ts";
import { KingdomSpawnTestHarness } from "./kingdomSpawnTestHarness.ts";

/**
 * Build a chain of N single-chunk volumes starting at (startX, startY)
 * going right. Returns each volume's chunk position in order.
 */
function buildVolumeChain(
    h: KingdomSpawnTestHarness,
    startX: number,
    startY: number,
    length: number,
): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < length; i++) {
        const pos = { x: startX + i, y: startY };
        h.addChunk(pos.x, pos.y, h.createVolume("plains", 4));
        positions.push(pos);
    }
    return positions;
}

describe("influenceScan", () => {
    it("influence decays monotonically with distance from kingdom", () => {
        const h = new KingdomSpawnTestHarness();
        const positions = buildVolumeChain(h, 5, 8, 20);
        h.placeKingdom({ x: 5, y: 8 }, KingdomType.Npc);

        const samples = positions
            .slice(0, 6)
            .map((pos) => computeInfluenceAtChunk(h.root, pos));

        assert.ok(samples[0] > 0, "influence at origin should be positive");

        for (let i = 1; i < samples.length; i++) {
            assert.ok(
                samples[i] < samples[i - 1],
                `influence at distance ${i} (${samples[i]}) should be less than at distance ${i - 1} (${samples[i - 1]})`,
            );
        }

        // Past the cutoff distance the BFS stops, so influence is 0
        const farInfluence = computeInfluenceAtChunk(h.root, positions[18]);
        assert.strictEqual(
            farInfluence,
            0,
            "influence should be zero beyond the cutoff distance",
        );
    });

    it("player kingdom projects stronger influence than NPC kingdom at equal distance", () => {
        const buildChain = (type: KingdomType) => {
            const h = new KingdomSpawnTestHarness();
            buildVolumeChain(h, 5, 10, 6);
            h.placeKingdom({ x: 5, y: 10 }, type);
            return h;
        };

        const hPlayer = buildChain(KingdomType.Player);
        const hNpc = buildChain(KingdomType.Npc);

        for (let dist = 0; dist <= 4; dist++) {
            const pos = { x: 5 + dist, y: 10 };
            const playerInfluence = computeInfluenceAtChunk(hPlayer.root, pos);
            const npcInfluence = computeInfluenceAtChunk(hNpc.root, pos);
            assert.ok(
                playerInfluence > npcInfluence,
                `player influence (${playerInfluence}) should exceed NPC influence (${npcInfluence}) at distance ${dist}`,
            );
        }
    });

    it("influence does not propagate across gaps in registered chunks", () => {
        const h = new KingdomSpawnTestHarness();
        // Kingdom in V1, chain V1→V2→V3, then gap, then isolated V4
        h.addChunk(3, 8, h.createVolume("plains", 4)); // V1, kingdom here
        h.addChunk(4, 8, h.createVolume("plains", 4)); // V2
        h.addChunk(5, 8, h.createVolume("plains", 4)); // V3
        // (6,8) is unregistered, a gap
        h.addChunk(7, 8, h.createVolume("plains", 4)); // V4, unreachable

        h.placeKingdom({ x: 3, y: 8 }, KingdomType.Npc);

        const influenceAfterGap = computeInfluenceAtChunk(h.root, {
            x: 7,
            y: 8,
        });

        assert.strictEqual(
            influenceAfterGap,
            0,
            "influence should not cross a gap of unregistered chunks",
        );
    });

    it("goblin camp influence is weaker than NPC kingdom influence at equal distance", () => {
        const buildChain = (type: KingdomType) => {
            const h = new KingdomSpawnTestHarness();
            buildVolumeChain(h, 5, 8, 6);
            h.placeKingdom({ x: 5, y: 8 }, type);
            return h;
        };

        const hGoblin = buildChain(KingdomType.Goblin);
        const hNpc = buildChain(KingdomType.Npc);

        for (let dist = 0; dist <= 3; dist++) {
            const pos = { x: 5 + dist, y: 8 };
            const goblinInfluence = computeInfluenceAtChunk(hGoblin.root, pos);
            const npcInfluence = computeInfluenceAtChunk(hNpc.root, pos);

            assert.ok(
                goblinInfluence < npcInfluence,
                `goblin influence (${goblinInfluence}) should be less than NPC influence (${npcInfluence}) at distance ${dist}`,
            );
            assert.ok(
                goblinInfluence > 0,
                `goblin influence at distance ${dist} should still be positive`,
            );
        }
    });
});
