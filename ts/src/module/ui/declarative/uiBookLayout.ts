import { addPoint } from "../../../common/point.js";
import { allSides } from "../../../common/sides.js";
import { Sprite2, sprites2 } from "../../asset/sprite.js";
import { ninePatchBackground } from "../uiBackground.js";
import { UISize } from "../uiSize.js";
import { OpenBookUIBackground } from "../visual/bookBackground.js";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.js";
import { uiButton } from "./uiButton.js";
import { uiImage } from "./uiImage.js";

export type UIBookLayoutTab = {
    icon: Sprite2;
    onTap: (index: number) => void;
    isSelected: boolean;
};

export enum UIBookLayoutMode {
    Single,
    Dual,
}

export enum UIBookLayoutPage {
    Left,
    Right,
}

type UiBookLayoutProps = {
    leftPage?: ComponentDescriptor;
    rightPage?: ComponentDescriptor;
    tabs?: UIBookLayoutTab[];
    currentPage?: UIBookLayoutPage;
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
const bookBackground = new OpenBookUIBackground();

export const uiBookLayout = createComponent<UiBookLayoutProps>(
    ({ props, withDraw, measureDescriptor, constraints }) => {
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
            tabDescriptor = createTabsComponent(props.tabs);
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

        // Draw the book background
        withDraw((scope, region) => {
            const backgroundPosition = addPoint(
                {
                    x: centerX + horizontalPadding + bookOffset,
                    y: centerY + verticalPadding,
                },
                { x: region.x, y: region.y },
            );

            bookBackground.draw(scope, backgroundPosition, {
                width: bookWidth,
                height: pageHeight,
            });
        });

        const children: PlacedChild[] = [];
        // Add left page with proper margins
        if (props.leftPage) {
            children.push({
                ...props.leftPage,
                offset: {
                    x: centerX + horizontalPadding + 28, // 16px page margin
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

// Helper function to create tabs component
function createTabsComponent(tabs: UIBookLayoutTab[]): ComponentDescriptor {
    return createComponent<{}>(() => {
        const tabChildren: PlacedChild[] = [];
        let yOffset = 0;

        tabs.forEach((tab, index) => {
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
                    sprite: sprites2.book_tab,
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
    })();
}
