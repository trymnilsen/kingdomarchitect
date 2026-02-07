import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { uiImage } from "../../../src/ui/declarative/uiImage.ts";
import { spriteRegistry } from "../../../src/asset/spriteRegistry.ts";
import type { SpriteRef } from "../../../src/asset/sprite.ts";
import {
    createConstraints,
    isLayoutResult,
    renderComponent,
} from "../declarative/declarativeUiTestHelpers.ts";

// Test sprite definitions: [width, height, x, y]
const testSprite16x16: SpriteRef = { bin: "test", spriteId: "test_16x16" };
const testSprite32x16: SpriteRef = { bin: "test", spriteId: "test_32x16" };
const testSprite16x32: SpriteRef = { bin: "test", spriteId: "test_16x32" };
const testSprite100x50: SpriteRef = { bin: "test", spriteId: "test_100x50" };

describe("UiImage", () => {
    beforeEach(() => {
        // Register test sprites before each test
        spriteRegistry.registerSprite(testSprite16x16, [16, 16, 0, 0]);
        spriteRegistry.registerSprite(testSprite32x16, [32, 16, 0, 0]);
        spriteRegistry.registerSprite(testSprite16x32, [16, 32, 0, 0]);
        spriteRegistry.registerSprite(testSprite100x50, [100, 50, 0, 0]);
    });

    describe("layout size", () => {
        it("returns the specified width and height", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 48,
            };
            const constraints = createConstraints(200, 200);

            const { result } = renderComponent(uiImage, props, constraints);

            assert.ok(isLayoutResult(result));
            assert.strictEqual(result.size.width, 64);
            assert.strictEqual(result.size.height, 48);
        });

        it("returns specified size regardless of fillMode", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 48,
                fillMode: "none" as const,
            };
            const constraints = createConstraints(200, 200);

            const { result } = renderComponent(uiImage, props, constraints);

            assert.ok(isLayoutResult(result));
            assert.strictEqual(result.size.width, 64);
            assert.strictEqual(result.size.height, 48);
        });
    });

    describe("fillMode: stretch (default)", () => {
        it("stretches sprite to match bounds exactly", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 48,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 10, y: 20, width: 64, height: 48 });

            assert.strictEqual(drawCapture.spriteCalls.length, 1);
            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 64);
            assert.strictEqual(call.targetHeight, 48);
            assert.strictEqual(call.x, 10);
            assert.strictEqual(call.y, 20);
        });

        it("uses stretch mode by default", () => {
            const props = {
                sprite: testSprite32x16,
                width: 64,
                height: 64,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 64 });

            const call = drawCapture.spriteCalls[0];
            // Stretch distorts aspect ratio to fill bounds
            assert.strictEqual(call.targetWidth, 64);
            assert.strictEqual(call.targetHeight, 64);
        });
    });

    describe("fillMode: none", () => {
        it("uses original sprite dimensions", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 48,
                fillMode: "none" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 10, y: 20, width: 64, height: 48 });

            assert.strictEqual(drawCapture.spriteCalls.length, 1);
            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 16);
            assert.strictEqual(call.targetHeight, 16);
        });

        it("centers sprite within bounds", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 48,
                fillMode: "none" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 48 });

            const call = drawCapture.spriteCalls[0];
            // Centered: (64 - 16) / 2 = 24, (48 - 16) / 2 = 16
            assert.strictEqual(call.x, 24);
            assert.strictEqual(call.y, 16);
        });
    });

    describe("fillMode: contain", () => {
        it("scales sprite to fit within bounds maintaining aspect ratio (wider bounds)", () => {
            // Sprite is 16x16, bounds are 64x32
            // To fit, scale by min(64/16, 32/16) = min(4, 2) = 2
            // Result: 32x32
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 32,
                fillMode: "contain" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 32 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 32);
            assert.strictEqual(call.targetHeight, 32);
        });

        it("scales sprite to fit within bounds maintaining aspect ratio (taller bounds)", () => {
            // Sprite is 16x16, bounds are 32x64
            // To fit, scale by min(32/16, 64/16) = min(2, 4) = 2
            // Result: 32x32
            const props = {
                sprite: testSprite16x16,
                width: 32,
                height: 64,
                fillMode: "contain" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 32, height: 64 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 32);
            assert.strictEqual(call.targetHeight, 32);
        });

        it("centers sprite when contained (horizontal letterboxing)", () => {
            // Sprite is 16x16, bounds are 64x32
            // Scaled to 32x32, centered: x = (64 - 32) / 2 = 16, y = (32 - 32) / 2 = 0
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 32,
                fillMode: "contain" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 32 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.x, 16);
            assert.strictEqual(call.y, 0);
        });

        it("handles wide sprite in tall bounds", () => {
            // Sprite is 32x16, bounds are 32x64
            // To fit, scale by min(32/32, 64/16) = min(1, 4) = 1
            // Result: 32x16
            const props = {
                sprite: testSprite32x16,
                width: 32,
                height: 64,
                fillMode: "contain" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 32, height: 64 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 32);
            assert.strictEqual(call.targetHeight, 16);
            // Centered vertically: y = (64 - 16) / 2 = 24
            assert.strictEqual(call.y, 24);
        });
    });

    describe("fillMode: fill", () => {
        it("scales sprite to cover bounds maintaining aspect ratio", () => {
            // Sprite is 16x16, bounds are 64x32
            // To cover, scale by max(64/16, 32/16) = max(4, 2) = 4
            // Result: 64x64
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 32,
                fillMode: "fill" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 32 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 64);
            assert.strictEqual(call.targetHeight, 64);
        });

        it("clips when sprite exceeds bounds", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 32,
                fillMode: "fill" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 10, y: 20, width: 64, height: 32 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.clipped, true);
            assert.deepStrictEqual(call.clipBounds, {
                x1: 10,
                y1: 20,
                x2: 74,
                y2: 52,
            });
        });

        it("centers sprite when filling (vertical overflow)", () => {
            // Sprite is 16x16, bounds are 64x32
            // Scaled to 64x64, centered: x = (64 - 64) / 2 = 0, y = (32 - 64) / 2 = -16
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 32,
                fillMode: "fill" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 32 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.x, 0);
            assert.strictEqual(call.y, -16);
        });

        it("handles tall sprite in wide bounds", () => {
            // Sprite is 16x32, bounds are 64x32
            // To cover, scale by max(64/16, 32/32) = max(4, 1) = 4
            // Result: 64x128
            const props = {
                sprite: testSprite16x32,
                width: 64,
                height: 32,
                fillMode: "fill" as const,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 32 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 64);
            assert.strictEqual(call.targetHeight, 128);
            // Centered vertically: y = (32 - 128) / 2 = -48
            assert.strictEqual(call.y, -48);
        });
    });

    describe("scale factor", () => {
        it("applies scale after fillMode sizing", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 64,
                fillMode: "stretch" as const,
                scale: 2,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 64 });

            const call = drawCapture.spriteCalls[0];
            // 64 * 2 = 128
            assert.strictEqual(call.targetWidth, 128);
            assert.strictEqual(call.targetHeight, 128);
        });

        it("clips when scale causes sprite to exceed bounds", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 64,
                fillMode: "stretch" as const,
                scale: 2,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 64 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.clipped, true);
        });

        it("centers scaled sprite within bounds", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 64,
                fillMode: "stretch" as const,
                scale: 2,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 64 });

            const call = drawCapture.spriteCalls[0];
            // 128x128 centered in 64x64: offset = (64 - 128) / 2 = -32
            assert.strictEqual(call.x, -32);
            assert.strictEqual(call.y, -32);
        });

        it("scale applies to contain mode", () => {
            // Sprite 16x16, bounds 64x32, contain scales to 32x32
            // Then scale 1.5 -> 48x48
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 32,
                fillMode: "contain" as const,
                scale: 1.5,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 32 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 48);
            assert.strictEqual(call.targetHeight, 48);
        });

        it("scale applies to none mode", () => {
            // Sprite 16x16, none mode keeps 16x16, then scale 2 -> 32x32
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 64,
                fillMode: "none" as const,
                scale: 2,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 64 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.targetWidth, 32);
            assert.strictEqual(call.targetHeight, 32);
        });

        it("does not clip when scale is less than 1", () => {
            const props = {
                sprite: testSprite16x16,
                width: 64,
                height: 64,
                fillMode: "stretch" as const,
                scale: 0.5,
            };
            const constraints = createConstraints(200, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiImage,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 64, height: 64 });

            const call = drawCapture.spriteCalls[0];
            assert.strictEqual(call.clipped, false);
            assert.strictEqual(call.targetWidth, 32);
            assert.strictEqual(call.targetHeight, 32);
        });
    });

});
