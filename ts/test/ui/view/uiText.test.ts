import { describe, it } from "node:test";
import assert from "node:assert";
import { uiText } from "../../../src/ui/declarative/uiText.ts";
import {
    wrapTextToLines,
    calculateVisibleLines,
    type MeasureTextFn,
} from "../../../src/ui/declarative/textWrapping.ts";
import {
    createConstraints,
    createTestTextStyle,
    isLayoutResult,
    renderComponent,
} from "../declarative/declarativeUiTestHelpers.ts";
import { fillUiSize } from "../../../src/ui/uiSize.ts";

const testStyle = createTestTextStyle();

function createFixedMeasureText(charWidth: number, lineHeight: number): MeasureTextFn {
    return (text: string) => ({
        width: text.length * charWidth,
        height: lineHeight,
    });
}

describe("UiText", () => {
    describe("wrapTextToLines", () => {
        it("returns single line when text fits within maxWidth", () => {
            const measureText = createFixedMeasureText(8, 16);
            const text = "Hello";
            const maxWidth = 100;

            const lines = wrapTextToLines(text, maxWidth, testStyle, measureText);

            assert.deepStrictEqual(lines, ["Hello"]);
        });

        it("wraps text to multiple lines when it exceeds maxWidth", () => {
            const measureText = createFixedMeasureText(8, 16);
            const text = "Hello World";
            const maxWidth = 50;

            const lines = wrapTextToLines(text, maxWidth, testStyle, measureText);

            assert.deepStrictEqual(lines, ["Hello", "World"]);
        });

        it("wraps long sentences across multiple lines", () => {
            const measureText = createFixedMeasureText(8, 16);
            const text = "The quick brown fox jumps";
            const maxWidth = 80;

            const lines = wrapTextToLines(text, maxWidth, testStyle, measureText);

            assert.strictEqual(lines.length, 3);
            assert.strictEqual(lines[0], "The quick");
            assert.strictEqual(lines[1], "brown fox");
            assert.strictEqual(lines[2], "jumps");
        });

        it("returns original text as single line when maxWidth is zero or negative", () => {
            const measureText = createFixedMeasureText(8, 16);
            const text = "Hello World";

            const linesZero = wrapTextToLines(text, 0, testStyle, measureText);
            const linesNegative = wrapTextToLines(text, -10, testStyle, measureText);

            assert.deepStrictEqual(linesZero, ["Hello World"]);
            assert.deepStrictEqual(linesNegative, ["Hello World"]);
        });

        it("handles single long word that exceeds maxWidth", () => {
            const measureText = createFixedMeasureText(8, 16);
            const text = "Supercalifragilistic";
            const maxWidth = 50;

            const lines = wrapTextToLines(text, maxWidth, testStyle, measureText);

            assert.strictEqual(lines.length, 1);
            assert.strictEqual(lines[0], "Supercalifragilistic");
        });

        it("handles empty string", () => {
            const measureText = createFixedMeasureText(8, 16);

            const lines = wrapTextToLines("", 100, testStyle, measureText);

            assert.deepStrictEqual(lines, [""]);
        });
    });

    describe("calculateVisibleLines", () => {
        it("returns all lines when overflow mode is overflow", () => {
            const lines = ["Line 1", "Line 2", "Line 3", "Line 4"];
            const lineHeight = 16;
            const availableHeight = 32;

            const visible = calculateVisibleLines(lines, lineHeight, availableHeight, "overflow");

            assert.deepStrictEqual(visible, lines);
        });

        it("truncates lines when overflow mode is truncate", () => {
            const lines = ["Line 1", "Line 2", "Line 3", "Line 4"];
            const lineHeight = 16;
            const availableHeight = 32;

            const visible = calculateVisibleLines(lines, lineHeight, availableHeight, "truncate");

            assert.strictEqual(visible.length, 2);
            assert.strictEqual(visible[0], "Line 1");
            assert.strictEqual(visible[1], "Line 2…");
        });

        it("adds ellipsis to last visible line when truncating", () => {
            const lines = ["First", "Second", "Third"];
            const lineHeight = 20;
            const availableHeight = 25;

            const visible = calculateVisibleLines(lines, lineHeight, availableHeight, "truncate");

            assert.strictEqual(visible.length, 1);
            assert.strictEqual(visible[0], "First…");
        });

        it("returns all lines when they fit within available height", () => {
            const lines = ["Line 1", "Line 2"];
            const lineHeight = 16;
            const availableHeight = 100;

            const visible = calculateVisibleLines(lines, lineHeight, availableHeight, "truncate");

            assert.deepStrictEqual(visible, ["Line 1", "Line 2"]);
        });

        it("always shows at least one line even if height is very small", () => {
            const lines = ["Only line"];
            const lineHeight = 50;
            const availableHeight = 10;

            const visible = calculateVisibleLines(lines, lineHeight, availableHeight, "truncate");

            assert.strictEqual(visible.length, 1);
        });
    });

    describe("uiText component", () => {
        it("measures single line text correctly", () => {
            const props = {
                content: "Hello",
                textStyle: testStyle,
            };
            const constraints = createConstraints(200, 100);

            const { result } = renderComponent(uiText, props, constraints);

            assert.ok(isLayoutResult(result));
            assert.strictEqual(result.size.width, 40);
            assert.strictEqual(result.size.height, 16);
        });

        it("wraps text when it exceeds constraint width", () => {
            const props = {
                content: "Hello World Test",
                textStyle: testStyle,
            };
            const constraints = createConstraints(80, 200);

            const { result } = renderComponent(uiText, props, constraints);

            assert.ok(isLayoutResult(result));
            assert.strictEqual(result.size.height, 32);
        });

        it("uses fill size when width is fillUiSize", () => {
            const props = {
                content: "Short",
                textStyle: testStyle,
                width: fillUiSize,
            };
            const constraints = createConstraints(300, 100);

            const { result } = renderComponent(uiText, props, constraints);

            assert.ok(isLayoutResult(result));
            assert.strictEqual(result.size.width, 300);
        });

        it("uses fill size when height is fillUiSize", () => {
            const props = {
                content: "Short",
                textStyle: testStyle,
                height: fillUiSize,
            };
            const constraints = createConstraints(200, 150);

            const { result } = renderComponent(uiText, props, constraints);

            assert.ok(isLayoutResult(result));
            assert.strictEqual(result.size.height, 150);
        });

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

        it("shows all lines when overflow is overflow regardless of height constraint", () => {
            const props = {
                content: "Line one Line two Line three",
                textStyle: testStyle,
                overflow: "overflow" as const,
            };
            const constraints = createConstraints(80, 20);

            const { drawCapture, executeDrawCalls } = renderComponent(
                uiText,
                props,
                constraints,
            );

            executeDrawCalls({ x: 0, y: 0, width: 80, height: 20 });

            assert.strictEqual(drawCapture.textCalls.length, 3);
        });
    });
});
