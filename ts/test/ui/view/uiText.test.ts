import { describe, it } from "node:test";
import assert from "node:assert";
import { uiText } from "../../../src/ui/declarative/uiText.ts";
import {
    wrapTextToLines,
    type MeasureTextFn,
} from "../../../src/ui/declarative/textWrapping.ts";
import {
    createConstraints,
    createTestTextStyle,
    renderComponent,
} from "../declarative/declarativeUiTestHelpers.ts";

const testStyle = createTestTextStyle();

function createFixedMeasureText(
    charWidth: number,
    lineHeight: number,
): MeasureTextFn {
    return (text: string) => ({
        width: text.length * charWidth,
        height: lineHeight,
    });
}

describe("UiText", () => {
    describe("wrapTextToLines", () => {
        it("wraps long sentences across multiple lines", () => {
            const measureText = createFixedMeasureText(8, 16);
            const text = "The quick brown fox jumps";
            const maxWidth = 80;

            const lines = wrapTextToLines(
                text,
                maxWidth,
                testStyle,
                measureText,
            );

            assert.strictEqual(lines.length, 3);
            assert.strictEqual(lines[0], "The quick");
            assert.strictEqual(lines[1], "brown fox");
            assert.strictEqual(lines[2], "jumps");
        });

        it("returns original text as single line when maxWidth is zero or negative", () => {
            const measureText = createFixedMeasureText(8, 16);
            const text = "Hello World";

            const linesZero = wrapTextToLines(text, 0, testStyle, measureText);
            const linesNegative = wrapTextToLines(
                text,
                -10,
                testStyle,
                measureText,
            );

            assert.deepStrictEqual(linesZero, ["Hello World"]);
            assert.deepStrictEqual(linesNegative, ["Hello World"]);
        });
    });

    describe("uiText component", () => {
        it("draws each line at correct y position", () => {
            const props = {
                content: "Hello World Test",
                textStyle: testStyle,
            };
            const constraints = createConstraints(60, 200);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiText,
                props,
                constraints,
            );

            executeDrawCalls({ x: 10, y: 20, width: 60, height: 200 });

            assert.strictEqual(drawCapture.textCalls.length, 3);
            assert.strictEqual(drawCapture.textCalls[0].y, 20);
            assert.strictEqual(drawCapture.textCalls[1].y, 36);
            assert.strictEqual(drawCapture.textCalls[2].y, 52);
        });

        it("truncates with ellipsis when overflow is truncate and text exceeds height", () => {
            const props = {
                content: "Line one Line two Line three Line four",
                textStyle: testStyle,
                overflow: "truncate" as const,
            };
            const constraints = createConstraints(80, 32);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiText,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 80, height: 32 });

            assert.strictEqual(drawCapture.textCalls.length, 2);
            assert.ok(drawCapture.textCalls[1].text.endsWith("…"));
        });
    });
});
