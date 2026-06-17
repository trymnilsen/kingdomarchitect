import { describe, it } from "node:test";
import assert from "node:assert";
import { Camera } from "../../src/rendering/camera.ts";
import { TileSize } from "../../src/game/map/tile.ts";

describe("Camera", () => {
    it("floors world space to tile space", () => {
        const camera = new Camera({ x: 200, y: 200 });
        // TileSize is 32; 70/32 = 2.18 -> 2, 33/32 = 1.03 -> 1
        const result = camera.worldSpaceToTileSpace({ x: 70, y: 33 });
        assert.deepStrictEqual(result, { x: 2, y: 1 });
    });

    it("converts tile space to world space", () => {
        const camera = new Camera({ x: 200, y: 200 });
        const result = camera.tileSpaceToWorldSpace({ x: 3, y: 4 });
        assert.deepStrictEqual(result, {
            x: 3 * TileSize,
            y: 4 * TileSize,
        });
    });

    it("round-trips screen and world space around the camera position", () => {
        const camera = new Camera({ x: 200, y: 200 });
        camera.position = { x: 500, y: 600 };
        const world = { x: 512, y: 640 };
        const screen = {
            x: camera.worldToScreenX(world.x),
            y: camera.worldToScreenY(world.y),
        };
        const back = camera.screenToWorld(screen);
        assert.deepStrictEqual(back, world);
    });

    it("maps a world point at the camera position to the window centre on screen", () => {
        const camera = new Camera({ x: 200, y: 200 });
        camera.position = { x: 500, y: 600 };
        // halfWindowSize is {100,100}; a point at the camera position lands at the centre
        assert.strictEqual(camera.worldToScreenX(500), 100);
        assert.strictEqual(camera.worldToScreenY(600), 100);
    });

    it("translate moves the camera by the given delta", () => {
        const camera = new Camera({ x: 200, y: 200 });
        camera.position = { x: 100, y: 100 };
        camera.translate({ x: 25, y: -40 });
        assert.deepStrictEqual(camera.position, { x: 125, y: 60 });
    });

    it("position setter floors the incoming point", () => {
        const camera = new Camera({ x: 200, y: 200 });
        camera.position = { x: 10.9, y: 20.7 };
        assert.deepStrictEqual(camera.position, { x: 10, y: 20 });
    });
});
