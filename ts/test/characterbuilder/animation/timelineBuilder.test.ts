import { describe, it } from "node:test";
import assert from "node:assert";
import { timeline } from "../../../src/characterbuilder/animation/timelineBuilder.ts";
import type { AnimationRecipe } from "../../../src/characterbuilder/animation/animationRecipe.ts";

describe("timeline builder — basic recipe structure", () => {
    it("produces correct name, base, and duration", () => {
        const recipe = timeline("test_idle")
            .basedOn("walk_southeast", 0)
            .duration(2)
            .build();

        assert.strictEqual(recipe.name, "test_idle");
        assert.strictEqual(recipe.base.type, "frame");
        if (recipe.base.type === "frame") {
            assert.strictEqual(recipe.base.sourceAnimation, "walk_southeast");
            assert.strictEqual(recipe.base.sourceFrame, 0);
        }
        assert.strictEqual(recipe.duration, 2);
        assert.deepStrictEqual(recipe.mirrorToggles, []);
        assert.deepStrictEqual(recipe.tracks, {});
        assert.deepStrictEqual(recipe.anchorTracks, {});
    });
});

describe("timeline builder — mirror toggles", () => {
    it("mirror() without at() adds toggle at frame 0", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(4)
            .mirror()
            .build();

        assert.deepStrictEqual(recipe.mirrorToggles, [0]);
    });

    it("at(t).mirror() adds toggle at frame t", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(40)
            .at(20)
            .mirror()
            .build();

        assert.deepStrictEqual(recipe.mirrorToggles, [20]);
    });

    it("multiple mirror calls accumulate toggles", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(40)
            .at(0)
            .mirror()
            .at(20)
            .mirror()
            .build();

        assert.deepStrictEqual(recipe.mirrorToggles, [0, 20]);
    });

    it("cursor resets to 0 after each mirror()", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(40)
            .at(20)
            .mirror()
            .mirror() // no at() — should use 0 (reset after previous mirror)
            .build();

        assert.deepStrictEqual(recipe.mirrorToggles, [20, 0]);
    });
});

describe("timeline builder — part track operations", () => {
    it("at().until().hide() produces correct operation", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(4)
            .part("LeftFoot", (t) => t.at(1).until(3).hide())
            .build();

        assert.deepStrictEqual(recipe.tracks["LeftFoot"], [
            { type: "hide", start: 1, end: 3 },
        ]);
    });

    it("at().hide() without until() spans exactly one frame", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(10)
            .part("LeftEye", (t) => t.at(4).hide())
            .build();

        assert.deepStrictEqual(recipe.tracks["LeftEye"], [
            { type: "hide", start: 4, end: 5 },
        ]);
    });

    it("chained at() operations produce separate operations", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(20)
            .part("LeftEye", (t) =>
                t.at(8).hide().at(9).show().at(14).hide().at(15).show(),
            )
            .build();

        assert.deepStrictEqual(recipe.tracks["LeftEye"], [
            { type: "hide", start: 8, end: 9 },
            { type: "show", start: 9, end: 10 },
            { type: "hide", start: 14, end: 15 },
            { type: "show", start: 15, end: 16 },
        ]);
    });

    it("offset operation stores x and y values", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(10)
            .part("Head", (t) => t.at(0).until(10).offset(0, 1))
            .build();

        assert.deepStrictEqual(recipe.tracks["Head"], [
            { type: "offset", start: 0, end: 10, x: 0, y: 1 },
        ]);
    });

    it("replaceWith stores source animation and frame", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(8)
            .part("RightHand", (t) => t.at(0).until(8).replaceWith("attack_se", 2))
            .build();

        assert.deepStrictEqual(recipe.tracks["RightHand"], [
            {
                type: "replace",
                start: 0,
                end: 8,
                source: { sourceAnimation: "attack_se", sourceFrame: 2 },
            },
        ]);
    });
});

describe("timeline builder — anchor track operations", () => {
    it("anchor offset is stored in anchorTracks", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(4)
            .anchor("LeftHand", (a) => a.at(1).until(3).offset(2, -1))
            .build();

        assert.deepStrictEqual(recipe.anchorTracks["LeftHand"], [
            { type: "offset", start: 1, end: 3, x: 2, y: -1 },
        ]);
    });

    it("anchor hide is stored in anchorTracks", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(4)
            .anchor("RightHand", (a) => a.at(0).until(2).hide())
            .build();

        assert.deepStrictEqual(recipe.anchorTracks["RightHand"], [
            { type: "hide", start: 0, end: 2 },
        ]);
    });
});

describe("timeline builder — copyFrom", () => {
    it("copyFrom copies all ops from the source part at build time", () => {
        const recipe = timeline("test")
            .basedOn("walk_se", 0)
            .duration(20)
            .part("LeftEye", (t) => t.at(8).hide().at(9).show())
            .part("RightEye", (t) => t.copyFrom("LeftEye"))
            .build();

        assert.deepStrictEqual(recipe.tracks["RightEye"], recipe.tracks["LeftEye"]);
    });

    it("throws at build() when copyFrom references an unconfigured part", () => {
        assert.throws(
            () =>
                timeline("test")
                    .basedOn("walk_se", 0)
                    .duration(4)
                    .part("RightEye", (t) => t.copyFrom("LeftEye")) // LeftEye never configured
                    .build(),
            (err: Error) => {
                assert.ok(err.message.includes("LeftEye"));
                return true;
            },
        );
    });
});

describe("timeline builder — validation", () => {
    it("throws when build() is called without basedOn()", () => {
        assert.throws(
            () => timeline("test").duration(2).build(),
            (err: Error) => {
                assert.ok(err.message.includes("basedOn"));
                return true;
            },
        );
    });

    it("throws when build() is called without duration() on a frame base", () => {
        assert.throws(
            () => timeline("test").basedOn("walk_se", 0).build(),
            (err: Error) => {
                assert.ok(err.message.includes("duration"));
                return true;
            },
        );
    });
});

describe("timeline builder — recipe base inheritance", () => {
    it("inherits duration from parent recipe when not overridden", () => {
        const parent: AnimationRecipe = {
            name: "parent",
            base: { type: "frame", sourceAnimation: "walk_se", sourceFrame: 0 },
            duration: 40,
            mirrorToggles: [],
            tracks: {},
            anchorTracks: {},
        };

        const child = timeline("child").basedOn(parent).build();

        assert.strictEqual(child.duration, 40);
    });

    it("inherits mirrorToggles from parent recipe", () => {
        const parent: AnimationRecipe = {
            name: "parent",
            base: { type: "frame", sourceAnimation: "walk_se", sourceFrame: 0 },
            duration: 40,
            mirrorToggles: [20],
            tracks: {},
            anchorTracks: {},
        };

        const child = timeline("child").basedOn(parent).build();

        assert.deepStrictEqual(child.mirrorToggles, [20]);
    });

    it("appends new toggles after inherited toggles", () => {
        const parent: AnimationRecipe = {
            name: "parent",
            base: { type: "frame", sourceAnimation: "walk_se", sourceFrame: 0 },
            duration: 40,
            mirrorToggles: [20],
            tracks: {},
            anchorTracks: {},
        };

        const child = timeline("child").basedOn(parent).mirror().build();

        // Inherited [20], new toggle at 0 → [20, 0]
        assert.deepStrictEqual(child.mirrorToggles, [20, 0]);
    });

    it("inherits parent tracks and can add new operations", () => {
        const parent: AnimationRecipe = {
            name: "parent",
            base: { type: "frame", sourceAnimation: "walk_se", sourceFrame: 0 },
            duration: 20,
            mirrorToggles: [],
            tracks: {
                LeftEye: [{ type: "hide", start: 8, end: 9 }],
            },
            anchorTracks: {},
        };

        const child = timeline("child")
            .basedOn(parent)
            .part("Head", (t) => t.at(0).until(20).offset(0, 1))
            .build();

        // Should have inherited LeftEye track
        assert.deepStrictEqual(child.tracks["LeftEye"], [
            { type: "hide", start: 8, end: 9 },
        ]);
        // And new Head track
        assert.deepStrictEqual(child.tracks["Head"], [
            { type: "offset", start: 0, end: 20, x: 0, y: 1 },
        ]);
    });

    it("base.type is 'recipe' when basedOn an AnimationRecipe", () => {
        const parent: AnimationRecipe = {
            name: "parent",
            base: { type: "frame", sourceAnimation: "walk_se", sourceFrame: 0 },
            duration: 4,
            mirrorToggles: [],
            tracks: {},
            anchorTracks: {},
        };

        const child = timeline("child").basedOn(parent).build();

        assert.strictEqual(child.base.type, "recipe");
        if (child.base.type === "recipe") {
            assert.strictEqual(child.base.recipe.name, "parent");
        }
    });
});
