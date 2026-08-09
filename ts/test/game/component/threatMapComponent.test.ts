import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    addThreat,
    createThreatMapComponent,
    effectiveThreat,
    getTopThreat,
    INTRUSION_THREAT,
    refreshIntrusionThreat,
    type ThreatMapComponent,
} from "../../../src/game/component/threatMapComponent.ts";

function worldWith(...entityIds: string[]): Entity {
    const root = new Entity("root");
    for (const id of entityIds) {
        const entity = new Entity(id);
        entity.worldPosition = { x: 12, y: 8 };
        root.addChild(entity);
    }
    return root;
}

function freshMap(): ThreatMapComponent {
    return createThreatMapComponent();
}

describe("threat entries", () => {
    it("holds an intrusion entry at INTRUSION_THREAT across repeated refreshes", () => {
        const root = worldWith("G1");
        const map = freshMap();
        refreshIntrusionThreat(map, "G1", 0, root);
        refreshIntrusionThreat(map, "G1", 5, root);
        refreshIntrusionThreat(map, "G1", 10, root);

        // Set-and-refresh, never accumulate: a loiterer must not outgrow an
        // active attacker.
        assert.strictEqual(map.threat["G1"].amount, INTRUSION_THREAT);
        assert.strictEqual(map.threat["G1"].time, 10);
        assert.strictEqual(map.threat["G1"].source, "intrusion");
    });

    it("does not downgrade a damage entry when refreshed by an intrusion", () => {
        const root = worldWith("G1");
        const map = freshMap();
        addThreat(map, "G1", 25, 0, root);
        refreshIntrusionThreat(map, "G1", 5, root);

        // A grudge keeps its amount and source. Only the clock is bumped.
        assert.strictEqual(map.threat["G1"].amount, 25);
        assert.strictEqual(map.threat["G1"].source, "damage");
        assert.strictEqual(map.threat["G1"].time, 5);
    });

    it("floors a new damage entry at INTRUSION_THREAT", () => {
        const root = worldWith("G1");
        const map = freshMap();
        // One hit must sustain pursuit at least as long as one sighting,
        // whatever the per-hit damage value is.
        addThreat(map, "G1", 1, 0, root);
        assert.strictEqual(map.threat["G1"].amount, INTRUSION_THREAT);
    });

    it("accumulates raw onto an existing entry", () => {
        const root = worldWith("G1");
        const map = freshMap();
        addThreat(map, "G1", 1, 0, root);
        addThreat(map, "G1", 1, 1, root);
        // The floor applies only at creation. Accumulation stays raw.
        assert.strictEqual(map.threat["G1"].amount, INTRUSION_THREAT + 1);
    });

    it("upgrades an intrusion entry to damage when the intruder hits", () => {
        const root = worldWith("G1");
        const map = freshMap();
        refreshIntrusionThreat(map, "G1", 0, root);
        addThreat(map, "G1", 1, 2, root);
        assert.strictEqual(map.threat["G1"].source, "damage");
    });

    it("decays linearly through effectiveThreat", () => {
        const entry = { amount: 10, time: 4, source: "damage" as const };
        assert.strictEqual(effectiveThreat(entry, 4), 10);
        assert.strictEqual(effectiveThreat(entry, 9), 5);
        assert.strictEqual(effectiveThreat(entry, 14), 0);
    });
});

describe("getTopThreat", () => {
    it("prefers any damage entry over a larger intrusion entry", () => {
        const root = worldWith("hitter", "loiterer");
        const map = freshMap();
        refreshIntrusionThreat(map, "loiterer", 0, root);
        addThreat(map, "hitter", 1, 5, root);

        // Effective at tick 5: loiterer 5, hitter 10, but even a small
        // damage entry must outrank every intrusion. Self-defence beats
        // hunting a trespasser.
        assert.strictEqual(getTopThreat(map, 5, root), "hitter");
    });

    it("skips entries whose entity no longer resolves", () => {
        const root = worldWith("liveGoblin");
        const map = freshMap();
        // The dead attacker has the larger entry but must not block engaging
        // the live goblin.
        map.threat["deadGoblin"] = { amount: 50, time: 0, source: "damage" };
        map.threat["liveGoblin"] = { amount: 12, time: 0, source: "damage" };

        assert.strictEqual(getTopThreat(map, 0, root), "liveGoblin");
    });

    it("skips decayed entries and returns undefined when all are stale", () => {
        const root = worldWith("G1");
        const map = freshMap();
        addThreat(map, "G1", 1, 0, root);

        assert.strictEqual(getTopThreat(map, 9, root), "G1");
        assert.strictEqual(getTopThreat(map, 10, root), undefined);
    });

    it("breaks ties by insertion order with strict greater-than", () => {
        const root = worldWith("first", "second");
        const map = freshMap();
        addThreat(map, "first", 12, 0, root);
        addThreat(map, "second", 12, 0, root);

        assert.strictEqual(getTopThreat(map, 0, root), "first");
    });
});

describe("write-time sweep", () => {
    it("deletes decayed and unresolvable entries on write", () => {
        const root = worldWith("liveGoblin", "newGoblin");
        const map = freshMap();
        map.threat["goneGoblin"] = { amount: 50, time: 0, source: "damage" };
        addThreat(map, "liveGoblin", 1, 0, root);

        // At tick 20 the live entry has decayed out and goneGoblin never
        // resolved. A write prunes both.
        refreshIntrusionThreat(map, "newGoblin", 20, root);

        assert.deepStrictEqual(Object.keys(map.threat), ["newGoblin"]);
    });
});
