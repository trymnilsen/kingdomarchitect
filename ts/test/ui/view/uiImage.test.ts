import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { uiImage } from "../../../src/ui/declarative/uiImage.ts";
import { spriteRegistry } from "../../../src/asset/spriteRegistry.ts";
import type { SpriteRef } from "../../../src/asset/sprite.ts";
import {
    createConstraints,
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

    describe("fillMode: contain", () => {
        it("scales sprite to fit within bounds maintaining aspect ratio (wider bounds)", () => {
            // 16x16 into 64x32 scales by min(64/16, 32/16) = 2.
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
            // 16x16 into 32x64 scales by min(32/16, 64/16) = 2.
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
    });
});
