import * as assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Camera } from "../../src/rendering/camera.js";
import { TileSize } from "../../src/game/map/tile.js";

describe("Camera class", () => {
    let camera: Camera;
    const windowSize = { x: 800, y: 600 };

    beforeEach(() => {
        camera = new Camera(windowSize);
    });

    it("should initialize with correct position and window size", () => {
        assert.deepStrictEqual(camera.position, { x: 0, y: 0 });
        assert.deepStrictEqual(camera.windowSize, windowSize);
    });

    it("should set position correctly", () => {
        camera.position = { x: 100, y: 150 };
        assert.deepStrictEqual(camera.position, { x: 100, y: 150 });

        // Set position with decimal values
        camera.position = { x: 100.5, y: 150.9 };
        assert.deepStrictEqual(camera.position, { x: 100, y: 150 });
    });

    it("should convert world space to tile space correctly", () => {
        const worldSpace = { x: 160, y: 240 };
        const expectedTileSpace = { x: 160 / TileSize, y: 240 / TileSize };

        const tileSpace = camera.worldSpaceToTileSpace(worldSpace);
        assert.deepStrictEqual(tileSpace, expectedTileSpace);
    });

    it("should convert tile space to world space correctly", () => {
        const tileSpace = { x: 5, y: 10 };
        const expectedWorldSpace = { x: 5 * TileSize, y: 10 * TileSize };

        const worldSpace = camera.tileSpaceToWorldSpace(tileSpace);
        assert.deepStrictEqual(worldSpace, expectedWorldSpace);
    });

    it("should convert tile space to screen space correctly", () => {
        const tileSpace = { x: 5, y: 10 };
        const tileWorldSpace = camera.tileSpaceToWorldSpace(tileSpace);

        // Calculate expected screen space manually using the formula
        const halfWindowSizeX = Math.floor(windowSize.x / 2);
        const halfWindowSizeY = Math.floor(windowSize.y / 2);
        const expectedScreenSpace = {
            x: Math.floor(
                tileWorldSpace.x - camera.position.x + halfWindowSizeX,
            ),
            y: Math.floor(
                tileWorldSpace.y - camera.position.y + halfWindowSizeY,
            ),
        };

        const screenSpace = camera.tileSpaceToScreenSpace(tileSpace);
        assert.deepStrictEqual(screenSpace, expectedScreenSpace);
    });

    it("should translate camera position correctly", () => {
        camera.position = { x: 100, y: 100 };
        camera.translate({ x: 50, y: 50 });

        assert.deepStrictEqual(camera.position, { x: 150, y: 150 });
    });

    it("should convert screen space to world space correctly", () => {
        const screenPoint = { x: 200, y: 300 };

        // Manually calculate the expected world coordinates
        const halfWindowSizeX = Math.floor(windowSize.x / 2);
        const halfWindowSizeY = Math.floor(windowSize.y / 2);
        const expectedWorldPoint = {
            x: screenPoint.x - halfWindowSizeX + camera.position.x,
            y: screenPoint.y - halfWindowSizeY + camera.position.y,
        };

        const worldPoint = camera.screenToWorld(screenPoint);
        assert.deepStrictEqual(worldPoint, expectedWorldPoint);
    });

    it("should convert world coordinates to screen coordinates correctly", () => {
        const worldX = 200;
        const worldY = 300;

        // Manually calculate expected screen coordinates
        const halfWindowSizeX = Math.floor(windowSize.x / 2);
        const halfWindowSizeY = Math.floor(windowSize.y / 2);
        const expectedScreenX = Math.floor(
            worldX - camera.position.x + halfWindowSizeX,
        );
        const expectedScreenY = Math.floor(
            worldY - camera.position.y + halfWindowSizeY,
        );

        const screenX = camera.worldToScreenX(worldX);
        const screenY = camera.worldToScreenY(worldY);

        assert.strictEqual(screenX, expectedScreenX);
        assert.strictEqual(screenY, expectedScreenY);
    });
});
