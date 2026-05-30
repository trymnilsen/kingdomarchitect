import { allSides } from "../../common/sides.ts";
import { spriteRefs, type SpriteRef } from "../../asset/sprite.ts";
import { ninePatchBackground } from "../uiBackground.ts";
import { type UISize, wrapUiSize } from "../uiSize.ts";
import { bookInkColor } from "../color.ts";
import {
    OpenBookPage,
    OpenBookUIBackground,
} from "../visual/bookBackground.ts";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.ts";
import { uiBox } from "./uiBox.ts";
import { uiButton } from "./uiButton.ts";
import { uiImage } from "./uiImage.ts";
import { uiText } from "./uiText.ts";

export type UIBookLayoutTab = {
    icon: SpriteRef;
    onTap: (index: number) => void;
    isSelected: boolean;
};

export const UIBookLayoutMode = {
    Single: 0,
    Dual: 1,
} as const;

export type UIBookLayoutMode =
    (typeof UIBookLayoutMode)[keyof typeof UIBookLayoutMode];

export const UIBookLayoutPage = {
    Left: 0,
    Right: 1,
} as const;

export type UIBookLayoutPage =
    (typeof UIBookLayoutPage)[keyof typeof UIBookLayoutPage];

type UiBookLayoutProps = {
    leftPage?: ComponentDescriptor;
    rightPage?: ComponentDescriptor;
    tabs?: UIBookLayoutTab[];
    currentPage?: UIBookLayoutPage;
    onPageChange?: (page: UIBookLayoutPage) => void;
};

const pageWidth = 300;
const pageHeight = 500;
const dualPageSize = pageWidth * 2;
const bookSize: UISize = {
    width: pageWidth * 2,
    height: pageHeight,
};
const horizontalPadding = 44;
const verticalPadding = 32;

export const uiBookLayout = createComponent<UiBookLayoutProps>(
    ({ props, measureDescriptor, constraints }) => {
        const currentPage = props.currentPage ?? UIBookLayoutPage.Left;

        // Determine layout mode based on available space
        const availableSize = {
            width: constraints.width - horizontalPadding * 2,
            height: constraints.height - verticalPadding * 2,
        };

        const mode =
            availableSize.width < dualPageSize
                ? UIBookLayoutMode.Single
                : UIBookLayoutMode.Dual;

        let bookWidth = bookSize.width;
        let bookOffset = 0;

        if (mode === UIBookLayoutMode.Single) {
            bookWidth = pageWidth;
            if (currentPage === UIBookLayoutPage.Left) {
                bookOffset = 0;
            } else {
                bookOffset = pageWidth * -1;
            }
        }

        const pageConstraints: UISize = {
            width: pageWidth - 40, // Account for page margins
            height: pageHeight - 32,
        };

        // Measure pages
        const leftPageSize = props.leftPage
            ? measureDescriptor("leftPage", props.leftPage, pageConstraints)
            : { width: 0, height: 0 };

        const rightPageSize = props.rightPage
            ? measureDescriptor("rightPage", props.rightPage, pageConstraints)
            : { width: 0, height: 0 };

        // Measure tabs if they exist
        let tabsSize = { width: 0, height: 0 };
        let tabDescriptor: ComponentDescriptor | undefined;
        if (props.tabs && props.tabs.length > 0) {
            tabDescriptor = uiBookTabs({ tabs: props.tabs });
            tabsSize = measureDescriptor(
                "tabs",
                tabDescriptor,
                { width: 100, height: 300 }, // Reasonable constraints for tabs
            );
        }

        // Calculate book position to center it in the container
        const bookContainerWidth = bookWidth + horizontalPadding * 2;
        const bookContainerHeight = pageHeight + verticalPadding * 2;

        const centerX = Math.max(
            0,
            (constraints.width - bookContainerWidth) / 2,
        );
        const centerY = Math.max(
            0,
            (constraints.height - bookContainerHeight) / 2,
        );

        const children: PlacedChild[] = [];

        // The book panel is a real, bounded box so it occludes taps over just
        // its own window (a click on the page does nothing) while a click on the
        // surrounding scrim still falls through to dismiss the modal. In single
        // mode only the visible page is drawn; in dual mode both halves are.
        const isSingleMode = mode === UIBookLayoutMode.Single;
        const bookWindowWidth = isSingleMode ? pageWidth : bookSize.width;
        let backgroundPage: OpenBookPage;
        if (isSingleMode) {
            backgroundPage =
                currentPage === UIBookLayoutPage.Right
                    ? OpenBookPage.Right
                    : OpenBookPage.Left;
        } else {
            backgroundPage = OpenBookPage.Both;
        }

        const bookBackgroundBox = uiBox({
            width: bookWindowWidth,
            height: pageHeight,
            background: new OpenBookUIBackground(backgroundPage),
        });

        children.push({
            ...bookBackgroundBox,
            offset: {
                x: centerX + horizontalPadding,
                y: centerY + verticalPadding,
            },
            size: { width: bookWindowWidth, height: pageHeight },
        });

        // Back button: only in single mode on the right page when a page-change handler is provided
        if (
            mode === UIBookLayoutMode.Single &&
            currentPage === UIBookLayoutPage.Right &&
            props.onPageChange
        ) {
            const backButton = uiButton({
                width: wrapUiSize,
                height: wrapUiSize,
                padding: 8,
                background: ninePatchBackground({
                    sprite: spriteRefs.book_border,
                    sides: allSides(8),
                    scale: 1,
                }),
                child: uiText({
                    content: "Back",
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 14,
                    },
                }),
                onTap: () => props.onPageChange!(UIBookLayoutPage.Left),
            });

            const backButtonSize = measureDescriptor("backButton", backButton, {
                width: pageWidth,
                height: 100,
            });

            children.push({
                ...backButton,
                size: backButtonSize,
                offset: {
                    x: centerX + horizontalPadding,
                    y: centerY + verticalPadding - backButtonSize.height - 8,
                },
            });
        }
        // Add left page with proper margins
        if (props.leftPage) {
            children.push({
                ...props.leftPage,
                offset: {
                    x: centerX + horizontalPadding + bookOffset + 28,
                    y: centerY + verticalPadding + 16,
                },
                size: leftPageSize,
            });
        }

        // Add right page with proper margins
        if (props.rightPage) {
            children.push({
                ...props.rightPage,
                offset: {
                    x:
                        centerX +
                        pageWidth +
                        horizontalPadding +
                        bookOffset +
                        16,
                    y: centerY + verticalPadding + 16,
                },
                size: rightPageSize,
            });
        }

        // Add tabs positioned as actual book tabs on the left side
        if (props.tabs && props.tabs.length > 0 && tabDescriptor) {
            children.push({
                ...tabDescriptor,
                size: tabsSize,
                offset: {
                    x: centerX + bookOffset + 8, // Position tabs to the left of the book
                    y: centerY + verticalPadding + 60, // Offset from top
                },
            });
        }

        return {
            size: {
                width: constraints.width,
                height: constraints.height,
            },
            children,
        };
    },
    { displayName: "UiBookLayout" },
);

// Tabs down the left edge of the book. Defined at module scope so its node
// identity stays stable across renders. A component minted fresh each render
// would be torn down and rebuilt every frame, which drops the press that tap
// recognition needs to match a pointer down with its matching up.
const uiBookTabs = createComponent<{ tabs: UIBookLayoutTab[] }>(
    ({ props }) => {
        const tabChildren: PlacedChild[] = [];
        let yOffset = 0;

        props.tabs.forEach((tab, index) => {
            const tabWidth = tab.isSelected ? 56 : 48;
            const tabHeight = 48;

            const tabButton = uiButton({
                width: tabWidth,
                height: tabHeight,
                padding: 8,
                onTap: () => {
                    tab.onTap(index);
                },
                child: uiImage({
                    sprite: tab.icon,
                    width: 32,
                    height: 32,
                }),
                background: ninePatchBackground({
                    sprite: spriteRefs.book_tab,
                    scale: 1,
                    sides: allSides(8),
                }),
            });

            tabChildren.push({
                ...tabButton,
                offset: {
                    x: tab.isSelected ? 0 : 8, // Indent non-selected tabs slightly
                    y: yOffset,
                },
                size: {
                    width: tabWidth,
                    height: tabHeight,
                },
            });

            yOffset += tabHeight + 4; // Smaller gap between tabs
        });

        return {
            size: { width: 64, height: yOffset },
            children: tabChildren,
        };
    },
    { displayName: "UiBookTabs" },
);
