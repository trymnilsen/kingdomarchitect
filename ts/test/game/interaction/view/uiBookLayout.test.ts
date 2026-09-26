import { describe, it } from "node:test";
import assert from "node:assert";
import {
    UIBookLayoutPage,
    uiBookLayout,
} from "../../../../src/ui/declarative/uiBookLayout.ts";
import {
    isLayoutResult,
    renderComponent,
} from "../../../ui/declarative/declarativeUiTestHelpers.ts";
import { uiText } from "../../../../src/ui/declarative/uiText.ts";
import { spriteRefs } from "../../../../src/asset/sprite.ts";

// Layout constants mirrored from uiBookLayout.ts
const PAGE_WIDTH = 300;
const PAGE_HEIGHT = 500;
const HORIZONTAL_PADDING = 44;
const VERTICAL_PADDING = 32;
const DUAL_MIN_WIDTH = PAGE_WIDTH * 2 + HORIZONTAL_PADDING * 2; // 688

function makeLeftPage() {
    return uiText({
        content: "Left",
        textStyle: { font: "TestFont", size: 12, color: "#000" },
    });
}

function makeRightPage() {
    return uiText({
        content: "Right",
        textStyle: { font: "TestFont", size: 12, color: "#000" },
    });
}

describe("UiBookLayout", () => {
    it("will use dual page mode if there is space", () => {
        const { result } = renderComponent(
            uiBookLayout,
            {
                leftPage: makeLeftPage(),
                rightPage: makeRightPage(),
                onPageChange: () => {},
            },
            { width: DUAL_MIN_WIDTH, height: 600 },
        );

        assert.ok(isLayoutResult(result));
        // Book background box + two page children, no back button above the book
        assert.strictEqual(result.children.length, 3);
        const bookTopY =
            Math.max(0, (600 - (PAGE_HEIGHT + VERTICAL_PADDING * 2)) / 2) +
            VERTICAL_PADDING;
        const allAbove = (
            result.children as Array<{ offset: { y: number } }>
        ).filter((c) => c.offset.y < bookTopY);
        assert.strictEqual(
            allAbove.length,
            0,
            "no child should be above the book in dual mode",
        );
    });

    it("will switch page if right page is set and mode is single page", () => {
        const narrowWidth = DUAL_MIN_WIDTH - 1;
        const { result } = renderComponent(
            uiBookLayout,
            {
                leftPage: makeLeftPage(),
                rightPage: makeRightPage(),
                currentPage: UIBookLayoutPage.Right,
            },
            { width: narrowWidth, height: 600 },
        );

        assert.ok(isLayoutResult(result));
        // Book background box + left page + right page
        assert.strictEqual(result.children.length, 3);

        // In single mode with right page, bookOffset = -pageWidth, so:
        // right page offset.x = centerX + pageWidth + horizontalPadding + bookOffset + 16
        //                      = centerX + horizontalPadding + 16
        // This should be within the visible area (positive and near horizontalPadding)
        const centerX = Math.max(
            0,
            (narrowWidth - (PAGE_WIDTH + HORIZONTAL_PADDING * 2)) / 2,
        );
        const expectedRightX =
            centerX + PAGE_WIDTH + HORIZONTAL_PADDING + -PAGE_WIDTH + 16;
        // Index 2: book background box (0), left page (1), right page (2).
        const rightChild = result.children[2] as any;
        assert.strictEqual(rightChild.offset.x, expectedRightX);
    });

    it("shows back button in single-page mode when on right page", () => {
        const narrowWidth = DUAL_MIN_WIDTH - 1;
        const backButtonW = 60;
        const backButtonH = 30;

        const { result } = renderComponent(
            uiBookLayout,
            {
                leftPage: makeLeftPage(),
                rightPage: makeRightPage(),
                currentPage: UIBookLayoutPage.Right,
                onPageChange: () => {},
            },
            { width: narrowWidth, height: 600 },
            {
                measureDescriptorFn: (_slotId, _descriptor, _constraints) => ({
                    width: backButtonW,
                    height: backButtonH,
                }),
            },
        );

        assert.ok(isLayoutResult(result));
        // Book background box + back button + left + right pages = 4 children
        assert.strictEqual(result.children.length, 4);

        const centerY = Math.max(
            0,
            (600 - (PAGE_HEIGHT + VERTICAL_PADDING * 2)) / 2,
        );
        const bookTopY = centerY + VERTICAL_PADDING;

        // Back button should be positioned above the book top
        const children = result.children as Array<{ offset: { y: number } }>;
        const aboveBook = children.filter((c) => c.offset.y < bookTopY);
        assert.strictEqual(
            aboveBook.length,
            1,
            "exactly one child (back button) should be above the book",
        );
    });

    it("tapping a tab will change selected tab", () => {
        let tappedIndex = -1;
        const tabs = [
            {
                icon: spriteRefs.book_tab,
                isSelected: false,
                onTap: (index: number) => {
                    tappedIndex = index;
                },
            },
        ];

        const { result } = renderComponent(
            uiBookLayout,
            { tabs },
            { width: 800, height: 600 },
        );

        assert.ok(isLayoutResult(result));
        // Find the tab descriptor child (last child when tabs are present)
        const tabChild = result.children[result.children.length - 1] as any;
        assert.ok(tabChild !== undefined, "tab child should be present");

        // The tab descriptor is a component. Render it to get the button children
        const tabContext = {
            props: tabChild.props,
            constraints: { width: 100, height: 300 },
            measureText: (_text: string, _style: any) => ({
                width: 0,
                height: 0,
            }),
            measureDescriptor: (
                _slotId: any,
                _descriptor: any,
                _constraints: any,
            ) => ({ width: 0, height: 0 }),
            withState: <T>(initial: T): [T, (v: T) => void] => [
                initial,
                () => {},
            ],
            withDraw: (_fn: any) => {},
            withEffect: (_fn: any) => {},
            withRemember: <T>(factory: () => T) => factory(),
            withPointerState: () => ({ pressed: false }),
            withPointerTap: (_handler: any) => {},
        };

        const tabLayout = tabChild.renderFn(tabContext);
        assert.ok(tabLayout !== null, "tab descriptor should render");
        assert.ok(
            tabLayout &&
                typeof tabLayout === "object" &&
                "children" in tabLayout,
            "tab layout should be a layout result",
        );

        const tabButtons = (tabLayout as any).children;
        assert.strictEqual(tabButtons.length, 1, "one button per tab");

        // Running the button's onTap should report the tab's index.
        tabButtons[0].props.onTap();
        assert.strictEqual(tappedIndex, 0, "tapping tab 0 reports index 0");
    });
});
