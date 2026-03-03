import assert from "node:assert";
import { describe, it } from "node:test";
import {
    renderComponent,
    createConstraints,
    createTestTextStyle,
    isLayoutResult,
    getDescriptorChildren,
    getDescriptorText,
} from "../declarative/declarativeUiTestHelpers.ts";
import { uiPaginatedList } from "../../../src/ui/declarative/uiPaginatedList.ts";
import { uiText } from "../../../src/ui/declarative/uiText.ts";
import { fillUiSize } from "../../../src/ui/uiSize.ts";

/**
 * Build a fixed set of uiText item descriptors for use in tests.
 * Items are labelled "Item 0" through "Item {count-1}".
 */
function buildItems(count: number) {
    const style = createTestTextStyle();
    return Array.from({ length: count }, (_, i) =>
        uiText({ content: `Item ${i}`, textStyle: style }),
    );
}

/**
 * measureDescriptorFn that always returns a fixed item size.
 * The paginated list only measures the first item to determine row height,
 * so a uniform size is sufficient for all tests.
 */
const fixedMeasure = () => ({ width: 200, height: 40 });

describe("uiPaginatedList", () => {
    /**
     * Pagination math reference (gap=4, itemHeight=40):
     *   constraints height=200:
     *     without footer: floor(200/44)=4 items/page, ceil(5/4)=2 pages → footer needed
     *     with footer:    available = 200-24-4 = 172; floor(172/44)=3 items/page; totalPages=2
     *     page 0: items[0..2], page 1: items[3..4]
     *   constraints height=400:
     *     without footer: floor(400/44)=9 items/page, ceil(3/9)=1 page → no footer
     */

    it("returns no children for empty items list", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: [], width: 200, height: 200 },
            createConstraints(200, 200),
            { measureDescriptorFn: fixedMeasure },
        );

        assert.ok(!isLayoutResult(result));
        assert.strictEqual(getDescriptorChildren(result).length, 0);
    });

    it("shows all items with no footer when they fit on one page", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(3), width: 200, height: 400 },
            createConstraints(200, 400),
            { measureDescriptorFn: fixedMeasure },
        );

        assert.ok(!isLayoutResult(result));
        assert.strictEqual(getDescriptorChildren(result).length, 3);
    });

    it("adds a footer when items overflow to multiple pages", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(5), width: 200, height: 200 },
            createConstraints(200, 200),
            { measureDescriptorFn: fixedMeasure },
        );

        assert.ok(!isLayoutResult(result));
        // 3 visible items + 1 footer row
        assert.strictEqual(getDescriptorChildren(result).length, 4);
    });

    it("shows page 1/2 in footer on first page", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(5), width: 200, height: 200 },
            createConstraints(200, 200),
            { measureDescriptorFn: fixedMeasure },
        );

        assert.ok(!isLayoutResult(result));
        const children = getDescriptorChildren(result);
        const footer = children[children.length - 1];
        const footerChildren = getDescriptorChildren(footer);
        assert.strictEqual(getDescriptorText(footerChildren[1]), "1/2");
    });

    it("shows page 2/2 in footer when seeded to page 1", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(5), width: 200, height: 200 },
            createConstraints(200, 200),
            {
                measureDescriptorFn: fixedMeasure,
                initialStateValues: [1],
            },
        );

        assert.ok(!isLayoutResult(result));
        // 2 visible items + 1 footer
        const children = getDescriptorChildren(result);
        assert.strictEqual(children.length, 3);
        const footer = children[children.length - 1];
        const footerChildren = getDescriptorChildren(footer);
        assert.strictEqual(getDescriptorText(footerChildren[1]), "2/2");
    });

    it("clamps out-of-range page to last page", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(5), width: 200, height: 200 },
            createConstraints(200, 200),
            {
                measureDescriptorFn: fixedMeasure,
                initialStateValues: [99],
            },
        );

        assert.ok(!isLayoutResult(result));
        // Same as page 1: 2 items + footer = 3 children
        assert.strictEqual(getDescriptorChildren(result).length, 3);
    });

    it("shows correct items on page 0", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(5), width: 200, height: 200 },
            createConstraints(200, 200),
            { measureDescriptorFn: fixedMeasure },
        );

        assert.ok(!isLayoutResult(result));
        const children = getDescriptorChildren(result);
        assert.strictEqual(getDescriptorText(children[0]), "Item 0");
        assert.strictEqual(getDescriptorText(children[2]), "Item 2");
    });

    it("shows correct items on seeded page 1", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(5), width: 200, height: 200 },
            createConstraints(200, 200),
            {
                measureDescriptorFn: fixedMeasure,
                initialStateValues: [1],
            },
        );

        assert.ok(!isLayoutResult(result));
        const children = getDescriptorChildren(result);
        assert.strictEqual(getDescriptorText(children[0]), "Item 3");
        assert.strictEqual(getDescriptorText(children[1]), "Item 4");
    });

    it("resolves fillUiSize width against constraints", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(5), width: fillUiSize, height: 200 },
            createConstraints(400, 200),
            { measureDescriptorFn: fixedMeasure },
        );

        assert.ok(!isLayoutResult(result));
        assert.strictEqual((result.props as any).width, 400);
    });

    it("resolves fillUiSize height against constraints", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            { items: buildItems(5), width: 200, height: fillUiSize },
            createConstraints(200, 300),
            { measureDescriptorFn: fixedMeasure },
        );

        assert.ok(!isLayoutResult(result));
        assert.strictEqual((result.props as any).height, 300);
    });
});
