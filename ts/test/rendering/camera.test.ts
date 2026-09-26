import { describe, it } from "node:test";
import assert from "node:assert";
import { Camera } from "../../src/rendering/camera.ts";

describe("Camera", () => {
    it("floors world space to tile space", () => {
        const camera = new Camera({ x: 200, y: 200 });
        // TileSize is 32; 70/32 = 2.18 -> 2, 33/32 = 1.03 -> 1
        const result = camera.worldSpaceToTileSpace({ x: 70, y: 33 });
        assert.deepStrictEqual(result, { x: 2, y: 1 });
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
});
