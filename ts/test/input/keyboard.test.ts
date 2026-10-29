import { describe, it } from "node:test";
import assert from "node:assert";
import { isGameKeyPress } from "../../src/input/keyboard.ts";

function press(
    overrides: Partial<{
        ctrlKey: boolean;
        altKey: boolean;
        metaKey: boolean;
        target: unknown;
    }> = {},
) {
    return {
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        target: { tagName: "CANVAS" },
        ...overrides,
    } as Parameters<typeof isGameKeyPress>[0];
}

describe("isGameKeyPress", () => {
    it("takes plain presses on the page", () => {
        assert.strictEqual(isGameKeyPress(press()), true);
    });

    it("leaves browser shortcuts like Ctrl+R to the browser", () => {
        assert.strictEqual(isGameKeyPress(press({ ctrlKey: true })), false);
        assert.strictEqual(isGameKeyPress(press({ metaKey: true })), false);
        assert.strictEqual(isGameKeyPress(press({ altKey: true })), false);
    });

    it("leaves typing in text fields alone", () => {
        assert.strictEqual(
            isGameKeyPress(press({ target: { tagName: "INPUT" } })),
            false,
        );
        assert.strictEqual(
            isGameKeyPress(
                press({ target: { tagName: "DIV", isContentEditable: true } }),
            ),
            false,
        );
    });
});
