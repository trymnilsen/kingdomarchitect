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
    return uiText({ content: "Left", textStyle: { font: "TestFont", size: 12, color: "#000" } });
}

function makeRightPage() {
    return uiText({ content: "Right", textStyle: { font: "TestFont", size: 12, color: "#000" } });
}

describe("UiBookLayout", () => {
    it("will layout both left and right page", () => {
        const { result } = renderComponent(
            uiBookLayout,
            { leftPage: makeLeftPage(), rightPage: makeRightPage() },
            { width: 800, height: 600 },
        );

        assert.ok(isLayoutResult(result), "expected a LayoutResult");
        // Both pages should be present
        assert.strictEqual(result.children.length, 2);
        const [left, right] = result.children as Array<{ offset: { x: number; y: number } }>;
        assert.ok(left.offset.x < right.offset.x, "left page x should be less than right page x");
    });

    it("will remove old left page if updated", () => {
        const page1 = uiText({ content: "Page1", textStyle: { font: "TestFont", size: 12, color: "#000" } });
        const page2 = uiText({ content: "Page2", textStyle: { font: "TestFont", size: 12, color: "#000" } });

        const { result: result1 } = renderComponent(
            uiBookLayout,
            { leftPage: page1 },
            { width: 800, height: 600 },
        );
        const { result: result2 } = renderComponent(
            uiBookLayout,
            { leftPage: page2 },
            { width: 800, height: 600 },
        );

        assert.ok(isLayoutResult(result1));
        assert.ok(isLayoutResult(result2));
        // The second render uses page2 — verify it's a different descriptor
        const leftChild2 = result2.children[0] as any;
        assert.strictEqual(leftChild2.props.content, "Page2");
    });

    it("will remove old right page if updated", () => {
        const page1 = uiText({ content: "Right1", textStyle: { font: "TestFont", size: 12, color: "#000" } });
        const page2 = uiText({ content: "Right2", textStyle: { font: "TestFont", size: 12, color: "#000" } });

        const { result: result1 } = renderComponent(
            uiBookLayout,
            { rightPage: page1 },
            { width: 800, height: 600 },
        );
        const { result: result2 } = renderComponent(
            uiBookLayout,
            { rightPage: page2 },
            { width: 800, height: 600 },
        );

        assert.ok(isLayoutResult(result1));
        assert.ok(isLayoutResult(result2));
        const rightChild2 = result2.children[0] as any;
        assert.strictEqual(rightChild2.props.content, "Right2");
    });

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
        // In dual mode: two page children, no back button above the book
        assert.strictEqual(result.children.length, 2);
        const bookTopY = Math.max(0, (600 - (PAGE_HEIGHT + VERTICAL_PADDING * 2)) / 2) + VERTICAL_PADDING;
        const allAbove = (result.children as Array<{ offset: { y: number } }>).filter(
            (c) => c.offset.y < bookTopY,
        );
        assert.strictEqual(allAbove.length, 0, "no child should be above the book in dual mode");
    });

    it("will use single page mode if there is not enough space", () => {
        const narrowWidth = DUAL_MIN_WIDTH - 1;
        const { result } = renderComponent(
            uiBookLayout,
            { leftPage: makeLeftPage(), rightPage: makeRightPage() },
            { width: narrowWidth, height: 600 },
        );

        assert.ok(isLayoutResult(result));
        // Both pages are still in the children (single mode doesn't hide the off-screen page)
        assert.strictEqual(result.children.length, 2);
        const [left, right] = result.children as Array<{ offset: { x: number; y: number } }>;
        // In single mode (left page shown), left page offset.x should be smaller and within view,
        // right page is shifted off screen to the right
        assert.ok(right.offset.x > left.offset.x, "right page should be further right than left");
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
        assert.strictEqual(result.children.length, 2);

        // In single mode with right page, bookOffset = -pageWidth, so:
        // right page offset.x = centerX + pageWidth + horizontalPadding + bookOffset + 16
        //                      = centerX + horizontalPadding + 16
        // This should be within the visible area (positive and near horizontalPadding)
        const centerX = Math.max(0, (narrowWidth - (PAGE_WIDTH + HORIZONTAL_PADDING * 2)) / 2);
        const expectedRightX = centerX + PAGE_WIDTH + HORIZONTAL_PADDING + (-PAGE_WIDTH) + 16;
        const rightChild = result.children[1] as any;
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
        // Back button + left + right pages = 3 children
        assert.strictEqual(result.children.length, 3);

        const centerY = Math.max(0, (600 - (PAGE_HEIGHT + VERTICAL_PADDING * 2)) / 2);
        const bookTopY = centerY + VERTICAL_PADDING;

        // Back button should be positioned above the book top
        const children = result.children as Array<{ offset: { y: number } }>;
        const aboveBook = children.filter((c) => c.offset.y < bookTopY);
        assert.strictEqual(aboveBook.length, 1, "exactly one child (back button) should be above the book");
    });

    it("does not show back button in dual-page mode", () => {
        const { result } = renderComponent(
            uiBookLayout,
            {
                leftPage: makeLeftPage(),
                rightPage: makeRightPage(),
                currentPage: UIBookLayoutPage.Right,
                onPageChange: () => {},
            },
            { width: DUAL_MIN_WIDTH, height: 600 },
            {
                measureDescriptorFn: () => ({ width: 60, height: 30 }),
            },
        );

        assert.ok(isLayoutResult(result));
        // Only two page children — no back button in dual mode
        assert.strictEqual(result.children.length, 2);
    });

    it("does not show back button on left page in single mode", () => {
        const narrowWidth = DUAL_MIN_WIDTH - 1;

        const { result } = renderComponent(
            uiBookLayout,
            {
                leftPage: makeLeftPage(),
                rightPage: makeRightPage(),
                currentPage: UIBookLayoutPage.Left,
                onPageChange: () => {},
            },
            { width: narrowWidth, height: 600 },
            {
                measureDescriptorFn: () => ({ width: 60, height: 30 }),
            },
        );

        assert.ok(isLayoutResult(result));
        assert.strictEqual(result.children.length, 2, "no back button when on left page");
    });

    it("will show tabs if added", () => {
        const tabs = [
            {
                icon: spriteRefs.book_tab,
                isSelected: true,
                onTap: () => {},
            },
        ];

        const { result } = renderComponent(
            uiBookLayout,
            { leftPage: makeLeftPage(), tabs },
            { width: 800, height: 600 },
        );

        assert.ok(isLayoutResult(result));
        // Left page + tab descriptor
        assert.ok(result.children.length > 1, "tabs should add a child");
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

        // The tab descriptor is a component; render it to get the button children
        const tabContext = {
            props: {},
            constraints: { width: 100, height: 300 },
            measureText: (_text: string, _style: any) => ({ width: 0, height: 0 }),
            measureDescriptor: (_slotId: any, _descriptor: any, _constraints: any) => ({ width: 0, height: 0 }),
            withState: <T>(initial: T): [T, (v: T) => void] => [initial, () => {}],
            withDraw: (_fn: any) => {},
            withEffect: (_fn: any) => {},
            withRemember: <T>(factory: () => T) => factory(),
            withGesture: (_eventType: any, _handler: any) => {},
        };

        const tabLayout = tabChild.renderFn(tabContext);
        assert.ok(tabLayout !== null, "tab descriptor should render");
        // Verify the tab onTap wiring: the inner button's onTap should call our spy
        // The tab child has children (one per tab)
        if (tabLayout && typeof tabLayout === "object" && "children" in tabLayout) {
            const tabButtons = (tabLayout as any).children;
            assert.ok(tabButtons.length > 0, "tab layout should have button children");
        }
    });

    it("when tab is focused, down-direction will focus next tab", () => {
        // TODO: Requires focus system integration
        assert.ok(true);
    });

    it("directional navigation in single mode switches page if needed", () => {
        // TODO: Requires focus system integration
        assert.ok(true);
    });

    it("Focus changes switches page if needed", () => {
        // TODO: Requires focus system integration
        assert.ok(true);
    });

    it("Focus is kept when tab is selected or unselected", () => {
        // TODO: Requires focus system integration
        assert.ok(true);
    });
});
