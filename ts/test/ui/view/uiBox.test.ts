import { describe, it } from "node:test";
import assert from "node:assert";
import {
    renderComponent,
    createConstraints,
    createTestTextStyle,
} from "../declarative/declarativeUiTestHelpers.ts";
import { uiBox } from "../../../src/ui/declarative/uiBox.ts";
import { uiText } from "../../../src/ui/declarative/uiText.ts";
import { wrapUiSize } from "../../../src/ui/uiSize.ts";
import type {
    LayoutResult,
    PlacedChild,
    UISize,
} from "../../../src/ui/declarative/ui.ts";

function childDescriptor() {
    return uiText({ content: "x", textStyle: createTestTextStyle() });
}

function asLayout(
    result: ReturnType<typeof renderComponent>["result"],
): LayoutResult {
    return result as LayoutResult;
}

describe("UiBox", () => {
    it("uses the fixed width/height for its size", () => {
        const { result } = renderComponent(
            uiBox,
            { width: 120, height: 80 },
            createConstraints(400, 300),
        );
        assert.deepStrictEqual(asLayout(result).size, {
            width: 120,
            height: 80,
        });
    });

    it("wraps to the child size when width/height are wrap", () => {
        const childSize: UISize = { width: 60, height: 40 };
        const { result } = renderComponent(
            uiBox,
            { width: wrapUiSize, height: wrapUiSize, child: childDescriptor() },
            createConstraints(400, 300),
            { measureDescriptorFn: () => childSize },
        );
        assert.deepStrictEqual(asLayout(result).size, childSize);
    });

    it("inflates the wrap size by padding and shrinks the child constraints", () => {
        const childSize: UISize = { width: 60, height: 40 };
        let receivedConstraints: UISize | null = null;
        const { result } = renderComponent(
            uiBox,
            {
                width: wrapUiSize,
                height: wrapUiSize,
                padding: 10,
                child: childDescriptor(),
            },
            createConstraints(400, 300),
            {
                measureDescriptorFn: (_slot, _descriptor, constraints) => {
                    receivedConstraints = constraints;
                    return childSize;
                },
            },
        );

        // Child measured against constraints shrunk by padding on both sides.
        assert.deepStrictEqual(receivedConstraints, {
            width: 400 - 20,
            height: 300 - 20,
        });
        // Box wrap size is child size plus padding on both sides.
        assert.deepStrictEqual(asLayout(result).size, {
            width: 60 + 20,
            height: 40 + 20,
        });
    });

    it("offsets the child according to the alignment", () => {
        const childSize: UISize = { width: 40, height: 40 };
        const { result } = renderComponent(
            uiBox,
            {
                width: 100,
                height: 100,
                child: childDescriptor(),
            },
            createConstraints(100, 100),
            { measureDescriptorFn: () => childSize },
        );

        const child = asLayout(result).children[0] as PlacedChild;
        // Default alignment is center: (100-40)/2 = 30 on each axis.
        assert.deepStrictEqual(child.offset, { x: 30, y: 30 });
        assert.deepStrictEqual(child.size, childSize);
    });
});
