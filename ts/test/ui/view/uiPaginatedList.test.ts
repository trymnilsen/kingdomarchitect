import assert from "node:assert";
import { describe, it } from "node:test";
import {
    renderComponent,
    createConstraints,
    createTestTextStyle,
    getDescriptorChildren,
    getDescriptorText,
} from "../declarative/declarativeUiTestHelpers.ts";
import {
    pagerWindow,
    uiPaginatedList,
} from "../../../src/ui/declarative/uiPaginatedList.ts";
import { uiText } from "../../../src/ui/declarative/uiText.ts";

/**
 * Row factory that labels each row with its global index so tests can assert the
 * factory is called with the right index for the current page.
 */
function renderIndexedItem(index: number) {
    return uiText({
        content: `Item ${index}`,
        textStyle: createTestTextStyle(),
    });
}

/**
 * The list returns a LayoutResult whose children are the placed item rows
 * (uiText with a `content`) followed, when more than one page exists, by the
 * pager footer (a uiRow with no `content`).
 */
function rowsOf(result: ReturnType<typeof renderComponent>["result"]) {
    return getDescriptorChildren(result).filter(
        (child) => getDescriptorText(child) !== undefined,
    );
}

describe("pagerWindow", () => {
    it("clamps to the end near the last pages", () => {
        assert.deepStrictEqual(pagerWindow(9, 10, 5), [5, 6, 7, 8, 9]);
    });
});

describe("uiPaginatedList", () => {
    it("builds rows for the seeded page using global indices", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            {
                itemCount: 20,
                itemsPerPage: 8,
                renderItem: renderIndexedItem,
                width: 200,
                height: 400,
            },
            createConstraints(200, 400),
            { initialStateValues: [1] },
        );

        const rows = rowsOf(result);
        assert.strictEqual(rows.length, 8);
        assert.strictEqual(getDescriptorText(rows[0]), "Item 8");
        assert.strictEqual(getDescriptorText(rows[7]), "Item 15");
    });

    it("clamps an out-of-range page to the last page", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            {
                itemCount: 20,
                itemsPerPage: 8,
                renderItem: renderIndexedItem,
                width: 200,
                height: 400,
            },
            createConstraints(200, 400),
            { initialStateValues: [99] },
        );

        const rows = rowsOf(result);
        assert.strictEqual(rows.length, 4);
        assert.strictEqual(getDescriptorText(rows[0]), "Item 16");
    });
});
