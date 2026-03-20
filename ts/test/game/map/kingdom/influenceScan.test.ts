import { describe, it } from "node:test";
import assert from "node:assert";
import {
    buildInfluenceMap,
    computeInfluenceAtChunk,
} from "../../../../src/game/map/kingdom/influenceScan.ts";
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
    it("returns zero influence when no kingdoms exist", () => {
        const h = new KingdomSpawnTestHarness();
        // Register some chunks with volumes but no kingdoms
        const v = h.createVolume("plains", 4);
        h.addChunk(5, 5, v);
        h.addChunk(6, 5, h.createVolume("plains", 4));

        const result = computeInfluenceAtChunk(h.root, { x: 5, y: 5 });

        assert.strictEqual(result, 0);
    });

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

        // Past the cutoff distance the BFS stops — influence is 0
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

    it("influence from multiple kingdoms combines to exceed either individual contribution", () => {
        const candidate = { x: 10, y: 10 };

        // Kingdom A approaching from the left (via horizontal chain)
        // Kingdom B approaching from above (via vertical chain)
        const setup = (includeA: boolean, includeB: boolean) => {
            const h = new KingdomSpawnTestHarness();
            const vCand = h.createVolume("plains", 4);
            h.addChunk(10, 10, vCand);
            // Horizontal chain: (7,10)→(8,10)→(9,10)→(10,10)
            for (let x = 7; x < 10; x++) {
                h.addChunk(x, 10, h.createVolume("plains", 4));
            }
            // Vertical chain: (10,7)→(10,8)→(10,9)→(10,10)
            for (let y = 7; y < 10; y++) {
                h.addChunk(10, y, h.createVolume("plains", 4));
            }
            if (includeA) h.placeKingdom({ x: 7, y: 10 }, KingdomType.Npc);
            if (includeB) h.placeKingdom({ x: 10, y: 7 }, KingdomType.Npc);
            return h;
        };

        const combined = computeInfluenceAtChunk(
            setup(true, true).root,
            candidate,
        );
        const onlyA = computeInfluenceAtChunk(
            setup(true, false).root,
            candidate,
        );
        const onlyB = computeInfluenceAtChunk(
            setup(false, true).root,
            candidate,
        );

        assert.ok(
            combined > onlyA,
            `combined (${combined}) should exceed A alone (${onlyA})`,
        );
        assert.ok(
            combined > onlyB,
            `combined (${combined}) should exceed B alone (${onlyB})`,
        );
    });

    it("influence does not propagate across gaps in registered chunks", () => {
        const h = new KingdomSpawnTestHarness();
        // Kingdom in V1, chain V1→V2→V3, then gap, then isolated V4
        h.addChunk(3, 8, h.createVolume("plains", 4)); // V1, kingdom here
        h.addChunk(4, 8, h.createVolume("plains", 4)); // V2
        h.addChunk(5, 8, h.createVolume("plains", 4)); // V3
        // (6,8) is unregistered — gap
        h.addChunk(7, 8, h.createVolume("plains", 4)); // V4 — unreachable

        h.placeKingdom({ x: 3, y: 8 }, KingdomType.Npc);

        const influenceAfterGap = computeInfluenceAtChunk(h.root, { x: 7, y: 8 });

        assert.strictEqual(
            influenceAfterGap,
            0,
            "influence should not cross a gap of unregistered chunks",
        );
    });

    it("influence is higher via a shorter volume path than a longer one", () => {
        const kingdomPos = { x: 7, y: 10 };
        const candidatePos = { x: 10, y: 10 };

        // Short path: direct horizontal chain — 3 volume hops
        const hShort = new KingdomSpawnTestHarness();
        for (let x = 7; x <= 10; x++) {
            hShort.addChunk(x, 10, hShort.createVolume("plains", 4));
        }
        hShort.placeKingdom(kingdomPos, KingdomType.Npc);
        const shortInfluence = computeInfluenceAtChunk(
            hShort.root,
            candidatePos,
        );

        // Long path: L-shape — no direct route, 7 volume hops
        // (7,10)→(7,11)→(7,12)→(8,12)→(9,12)→(10,12)→(10,11)→(10,10)
        const hLong = new KingdomSpawnTestHarness();
        for (let y = 10; y <= 12; y++) {
            hLong.addChunk(7, y, hLong.createVolume("plains", 4));
        }
        for (let x = 8; x <= 10; x++) {
            hLong.addChunk(x, 12, hLong.createVolume("plains", 4));
        }
        for (let y = 11; y >= 10; y--) {
            hLong.addChunk(10, y, hLong.createVolume("plains", 4));
        }
        hLong.placeKingdom(kingdomPos, KingdomType.Npc);
        const longInfluence = computeInfluenceAtChunk(hLong.root, candidatePos);

        assert.ok(
            shortInfluence > longInfluence,
            `short path influence (${shortInfluence}) should exceed long path influence (${longInfluence})`,
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

    it("influence at kingdom origin is positive and is the maximum value in the map", () => {
        const kingdomPos = { x: 6, y: 9 };
        const h = new KingdomSpawnTestHarness();

        // 5×5 grid of single-chunk volumes around kingdom
        for (let x = 4; x <= 8; x++) {
            for (let y = 7; y <= 11; y++) {
                h.addChunk(x, y, h.createVolume("plains", 4));
            }
        }
        h.placeKingdom(kingdomPos, KingdomType.Npc);

        const influenceMap = buildInfluenceMap(h.root);
        const originVolume = h.getVolumeAtChunk(kingdomPos.x, kingdomPos.y);
        assert.ok(originVolume, "kingdom chunk must have a volume");
        const originInfluence = influenceMap.get(originVolume.id) ?? 0;

        assert.ok(originInfluence > 0, "origin influence should be positive");

        for (const [id, value] of influenceMap) {
            assert.ok(
                originInfluence >= value,
                `origin influence (${originInfluence}) should be >= volume ${id} (${value})`,
            );
        }
    });
});
