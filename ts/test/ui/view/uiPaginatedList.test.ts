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
    paginatedItemHeight,
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

function hasFooter(result: ReturnType<typeof renderComponent>["result"]) {
    return getDescriptorChildren(result).some(
        (child) => getDescriptorText(child) === undefined,
    );
}

describe("pagerWindow", () => {
    it("returns every page when total fits the window", () => {
        assert.deepStrictEqual(pagerWindow(0, 3, 5), [0, 1, 2]);
    });

    it("anchors to the start near the first pages", () => {
        assert.deepStrictEqual(pagerWindow(1, 10, 5), [0, 1, 2, 3, 4]);
    });

    it("centers on the current page in the middle", () => {
        assert.deepStrictEqual(pagerWindow(5, 10, 5), [3, 4, 5, 6, 7]);
    });

    it("clamps to the end near the last pages", () => {
        assert.deepStrictEqual(pagerWindow(9, 10, 5), [5, 6, 7, 8, 9]);
    });

    it("never produces indices past the last page", () => {
        const pages = pagerWindow(7, 8, 5);
        assert.deepStrictEqual(pages, [3, 4, 5, 6, 7]);
    });
});

/** Reads the placed height a row was given. */
function rowHeights(result: ReturnType<typeof renderComponent>["result"]) {
    return rowsOf(result).map(
        (row) => (row as unknown as { size: { height: number } }).size.height,
    );
}

describe("paginatedItemHeight", () => {
    it("divides the item area evenly across the page count, minus gaps", () => {
        // (400 - 7*4) / 8 = 46.5 -> 46
        assert.strictEqual(paginatedItemHeight(400, 8, 4), 46);
    });

    it("ignores gap when there is a single row per page", () => {
        assert.strictEqual(paginatedItemHeight(400, 1, 4), 400);
    });

    it("never returns less than one", () => {
        assert.strictEqual(paginatedItemHeight(10, 8, 4), 1);
    });
});

describe("uiPaginatedList", () => {
    it("shows all rows and no footer when one page suffices", () => {
        const { result } = renderComponent(
            uiPaginatedList,
            {
                itemCount: 3,
                itemsPerPage: 8,
                renderItem: renderIndexedItem,
                width: 200,
                height: 400,
            },
            createConstraints(200, 400),
        );

        assert.strictEqual(hasFooter(result), false);
        assert.strictEqual(rowsOf(result).length, 3);
    });

    it("fills a full page and adds a footer when items overflow", () => {
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
        );

        assert.strictEqual(hasFooter(result), true);
        assert.strictEqual(rowsOf(result).length, 8);
        const rows = rowsOf(result);
        assert.strictEqual(getDescriptorText(rows[0]), "Item 0");
        assert.strictEqual(getDescriptorText(rows[7]), "Item 7");
    });

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

    it("renders a partial last page", () => {
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
            { initialStateValues: [2] },
        );

        const rows = rowsOf(result);
        assert.strictEqual(rows.length, 4);
        assert.strictEqual(getDescriptorText(rows[0]), "Item 16");
        assert.strictEqual(getDescriptorText(rows[3]), "Item 19");
    });

    it("gives every row the same height on a full and a partial page", () => {
        const props = {
            itemCount: 20,
            itemsPerPage: 8,
            renderItem: renderIndexedItem,
            width: 200,
            height: 400,
        };
        const full = renderComponent(
            uiPaginatedList,
            props,
            createConstraints(200, 400),
        );
        const partial = renderComponent(
            uiPaginatedList,
            props,
            createConstraints(200, 400),
            { initialStateValues: [2] },
        );

        const fullHeights = rowHeights(full.result);
        const partialHeights = rowHeights(partial.result);
        // Every row on the full page shares one height...
        assert.ok(fullHeights.every((h) => h === fullHeights[0]));
        // ...and the partial last page uses that same per-row height.
        assert.ok(partialHeights.every((h) => h === fullHeights[0]));
        assert.strictEqual(partialHeights.length, 4);
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
