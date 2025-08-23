import { allSides } from "../../../common/sides.js";
import { sprites2 } from "../../../asset/sprite.js";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "../../../ui/declarative/ui.js";
import { uiBox } from "../../../ui/declarative/uiBox.js";
import { uiImage } from "../../../ui/declarative/uiImage.js";
import {
    CrossAxisAlignment,
    uiColumn,
} from "../../../ui/declarative/uiSequence.js";
import { uiText } from "../../../ui/declarative/uiText.js";
import { ninePatchBackground } from "../../../ui/uiBackground.js";
import { wrapUiSize, zeroSize, type UISize } from "../../../ui/uiSize.js";
import { actionbarTextStyle } from "../../../rendering/text/textStyle.js";

type UiButtonProps = {
    text: string;
    onClick?: () => void;
    onExpand?: () => void;
    icon?: import("../../../asset/sprite.js").Sprite2;
    hasChildren?: boolean;
};

const uiMenuButton = createComponent<UiButtonProps>(
    ({ props, withGesture }) => {
        if (props.onClick || props.onExpand) {
            withGesture("tap", (_event) => {
                console.log(`Menu button tapped: ${props.text}`);
                if (props.hasChildren && props.onExpand) {
                    props.onExpand();
                } else if (props.onClick) {
                    props.onClick();
                }
                return true;
            });
        }
        return uiColumn({
            width: wrapUiSize,
            height: wrapUiSize,
            crossAxisAlignment: CrossAxisAlignment.Center,
            children: [
                uiBox({
                    width: 56,
                    height: 56,
                    background: ninePatchBackground({
                        sprite: sprites2.stone_slate_background_2x,
                        sides: allSides(8),
                    }),
                    child: props.icon
                        ? uiImage({
                              sprite: props.icon,
                              width: 32,
                              height: 32,
                          })
                        : undefined,
                }),
                uiBox({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    padding: 8,
                    child: uiText({
                        textStyle: actionbarTextStyle,
                        content: props.text,
                    }),
                    background: ninePatchBackground({
                        sprite: sprites2.book_border,
                        sides: allSides(8),
                    }),
                }),
            ],
        });
    },
);

type ScaffoldButton = {
    text: string;
    onClick?: () => void;
    icon?: import("../../../asset/sprite.js").Sprite2;
    children?: ScaffoldButton[];
};

enum MenuState {
    closed,
    left,
    main,
    other,
}

type ExpandedMenuState = {
    expandedButtonIndex: number | null;
    expandedGroup: "left" | "right" | null;
};

type MeasuredButtons = {
    totalWidth: number;
    maxHeight: number;
    sizes: UISize[];
};

const spacing = 8;

type ScaffoldProps = {
    leftButtons?: ScaffoldButton[];
    rightButtons?: ScaffoldButton[];
    content?: ComponentDescriptor;
};

export const uiScaffold = createComponent<ScaffoldProps>(
    ({ constraints, measureDescriptor, withState, withEffect, props }) => {
        withEffect(() => {
            console.log("Mounted ui scaffold");
            return () => {
                console.log("Disposed ui scaffold");
            };
        });
        const [_menuState, _setMenuState] = withState(MenuState.closed);
        const [expandedMenu, setExpandedMenu] = withState<ExpandedMenuState>({
            expandedButtonIndex: null,
            expandedGroup: null,
        });

        // Helper function to create button handlers
        const createButtonHandler = (
            button: ScaffoldButton,
            index: number,
            group: "left" | "right",
        ) => {
            if (button.children && button.children.length > 0) {
                return {
                    ...button,
                    hasChildren: true,
                    onExpand: () => {
                        if (
                            expandedMenu.expandedButtonIndex === index &&
                            expandedMenu.expandedGroup === group
                        ) {
                            // Collapse if already expanded
                            setExpandedMenu({
                                expandedButtonIndex: null,
                                expandedGroup: null,
                            });
                        } else {
                            // Expand this menu
                            setExpandedMenu({
                                expandedButtonIndex: index,
                                expandedGroup: group,
                            });
                        }
                    },
                };
            }
            return {
                ...button,
                hasChildren: false,
            };
        };

        // Use props or defaults if not provided
        const leftButtons = (props.leftButtons || []).map((button, index) =>
            uiMenuButton(createButtonHandler(button, index, "left")),
        );
        const rightButtons = (props.rightButtons || []).map((button, index) =>
            uiMenuButton(createButtonHandler(button, index, "right")),
        );

        const measureButtons = (
            descriptors: ComponentDescriptor[],
        ): MeasuredButtons => {
            let totalWidth = 0;
            let maxHeight = 0;
            const sizes: UISize[] = [];
            for (let index = 0; index < descriptors.length; index++) {
                const descriptor = descriptors[index];
                const buttonSize = measureDescriptor(
                    descriptor.key ?? index,
                    descriptor,
                    constraints,
                );
                if (buttonSize.height > maxHeight) {
                    maxHeight = buttonSize.height;
                }
                totalWidth += buttonSize.width;
                // Add spacing between buttons (but not after the last one)
                if (index < descriptors.length - 1) {
                    totalWidth += spacing;
                }
                sizes.push(buttonSize);
            }
            return { totalWidth, maxHeight, sizes };
        };

        // Helper function to render expanded child menu
        const renderExpandedMenu = (
            sourceButtons: ScaffoldButton[],
            parentButtonData: PlacedChild,
            keyPrefix: string,
        ) => {
            // Create child menu buttons
            const childButtons = sourceButtons.map((sourceButton) =>
                uiMenuButton({
                    text: sourceButton.text,
                    onClick: sourceButton.onClick
                        ? () => {
                              // Close the expanded menu first
                              setExpandedMenu({
                                  expandedButtonIndex: null,
                                  expandedGroup: null,
                              });
                              // Then execute the action
                              sourceButton.onClick?.();
                          }
                        : undefined,
                    icon: sourceButton.icon,
                    hasChildren: false,
                }),
            );

            // Measure child buttons
            const childSizes = childButtons.map((childButton, childIndex) =>
                measureDescriptor(
                    `${keyPrefix}-${childIndex}`,
                    childButton,
                    constraints,
                ),
            );

            // Calculate the center position of the parent button
            const parentCenterX =
                parentButtonData.offset.x + parentButtonData.size.width / 2;

            // Stack children upward from the parent button
            let childY = parentButtonData.offset.y;
            const childrenToAdd: PlacedChild[] = [];

            childButtons.forEach((childButton, childIndex) => {
                const childSize = childSizes[childIndex];
                childY -= childSize.height + spacing;

                // Align child button center with parent button center
                // Since all buttons have centered icon boxes, centering the buttons will align the icons
                const childX = parentCenterX - childSize.width / 2;

                childrenToAdd.push({
                    offset: {
                        x: childX,
                        y: Math.max(0, childY), // Ensure it doesn't go above screen
                    },
                    size: childSize,
                    ...childButton,
                });
            });

            return childrenToAdd;
        };

        const leftSize = measureButtons(leftButtons);
        const rightSize = measureButtons(rightButtons);

        // Check if both button groups can fit horizontally without overlap or cramping
        const width = leftSize.totalWidth + rightSize.totalWidth;
        const height = Math.max(leftSize.maxHeight, rightSize.maxHeight);
        // Add spacing between left and right groups if both exist
        const betweenGroupSpacing =
            leftButtons.length > 0 && rightButtons.length > 0 ? spacing : 0;
        if (width + betweenGroupSpacing <= constraints.width) {
            let buttonX = 0;
            const left = leftButtons.map<PlacedChild>((button, index) => {
                const buttonSize = leftSize.sizes[index];
                const y = constraints.height - buttonSize.height;
                const x = buttonX;
                buttonX += buttonSize.width;
                // Add spacing between buttons (but not after the last one)
                if (index < leftButtons.length - 1) {
                    buttonX += spacing;
                }
                return {
                    offset: { x, y },
                    size: buttonSize,
                    ...button,
                };
            });

            let children: PlacedChild[] = [...left];

            // Add right buttons - maintain order but align to right
            let right: PlacedChild[] = [];
            if (rightButtons.length > 0) {
                let rightButtonX = constraints.width - rightSize.totalWidth;
                right = rightButtons.map<PlacedChild>((button, index) => {
                    const buttonSize = rightSize.sizes[index];
                    const y = constraints.height - buttonSize.height;
                    const x = rightButtonX;
                    rightButtonX += buttonSize.width;

                    // Add spacing between buttons (but not after the last one)
                    if (index < rightButtons.length - 1) {
                        rightButtonX += spacing;
                    }

                    return {
                        offset: { x, y },
                        size: buttonSize,
                        ...button,
                    };
                });
                children.push(...right);
            }

            // Handle expanded child menus
            if (
                expandedMenu.expandedButtonIndex !== null &&
                expandedMenu.expandedGroup !== null
            ) {
                const isLeftGroup = expandedMenu.expandedGroup === "left";
                const sourceButtons = isLeftGroup
                    ? props.leftButtons || []
                    : props.rightButtons || [];
                const sourceButton =
                    sourceButtons[expandedMenu.expandedButtonIndex];

                if (sourceButton?.children) {
                    // Find the parent button position
                    const parentButtonData = isLeftGroup
                        ? left[expandedMenu.expandedButtonIndex]
                        : right[expandedMenu.expandedButtonIndex];

                    if (parentButtonData) {
                        const expandedChildren = renderExpandedMenu(
                            sourceButton.children,
                            parentButtonData,
                            `child-${expandedMenu.expandedButtonIndex}`,
                        );
                        children.push(...expandedChildren);
                    }
                }
            }

            // Add content if provided - should fill the space above the buttons
            if (props.content) {
                const contentHeight = constraints.height - height - spacing;
                const contentConstraints = {
                    width: constraints.width,
                    height: Math.max(0, contentHeight),
                };

                const contentSize = measureDescriptor(
                    "content",
                    props.content,
                    contentConstraints,
                );

                children.push({
                    offset: { x: 0, y: 0 },
                    size: contentSize,
                    ...props.content,
                });
            }

            return {
                children: children,
                size: { width: constraints.width, height: constraints.height },
            };
        } else {
            // Not enough space for buttons, collapse the left buttons into an expanding menu
            let children: PlacedChild[] = [];

            // Create collapsed "Actions" menu from left buttons if they exist
            const hasLeftButtons =
                props.leftButtons && props.leftButtons.length > 0;
            let collapsedMenuButton: ComponentDescriptor | null = null;

            if (hasLeftButtons) {
                collapsedMenuButton = uiMenuButton({
                    text: "Actions",
                    hasChildren: true,
                    onExpand: () => {
                        if (
                            expandedMenu.expandedButtonIndex === 0 &&
                            expandedMenu.expandedGroup === "left"
                        ) {
                            // Collapse if already expanded
                            setExpandedMenu({
                                expandedButtonIndex: null,
                                expandedGroup: null,
                            });
                        } else {
                            // Expand this menu
                            setExpandedMenu({
                                expandedButtonIndex: 0,
                                expandedGroup: "left",
                            });
                        }
                    },
                });
            }

            // Measure individual button groups for proper alignment
            let collapsedMenuSize: UISize | null = null;
            if (collapsedMenuButton) {
                collapsedMenuSize = measureDescriptor(
                    "collapsed-menu",
                    collapsedMenuButton,
                    constraints,
                );
            }
            const rightSize = measureButtons(rightButtons);

            // Position collapsed menu button on the left (if it exists)
            if (collapsedMenuButton && collapsedMenuSize) {
                const y = constraints.height - collapsedMenuSize.height;
                children.push({
                    offset: { x: 0, y },
                    size: collapsedMenuSize,
                    ...collapsedMenuButton,
                });
            }

            // Position right buttons aligned to the right
            if (rightButtons.length > 0) {
                let rightButtonX = constraints.width - rightSize.totalWidth;
                rightButtons.forEach((button, index) => {
                    const buttonSize = rightSize.sizes[index];
                    const y = constraints.height - buttonSize.height;
                    const x = rightButtonX;
                    rightButtonX += buttonSize.width;

                    // Add spacing between buttons (but not after the last one)
                    if (index < rightButtons.length - 1) {
                        rightButtonX += spacing;
                    }

                    children.push({
                        offset: { x, y },
                        size: buttonSize,
                        ...button,
                    });
                });
            } // Handle expanded menus in compact mode
            if (
                expandedMenu.expandedButtonIndex !== null &&
                expandedMenu.expandedGroup !== null
            ) {
                let sourceButtons: ScaffoldButton[] = [];
                let parentButtonData: PlacedChild | undefined;
                let keyPrefix = "";

                if (
                    expandedMenu.expandedGroup === "left" &&
                    expandedMenu.expandedButtonIndex === 0 &&
                    props.leftButtons
                ) {
                    // Handle expanded Actions menu (collapsed left buttons)
                    sourceButtons = props.leftButtons;
                    parentButtonData = children[0];
                    keyPrefix = "left-child-0";
                } else if (
                    expandedMenu.expandedGroup === "right" &&
                    props.rightButtons
                ) {
                    // Handle expanded right button menus
                    const sourceButton =
                        props.rightButtons[expandedMenu.expandedButtonIndex];
                    if (sourceButton?.children) {
                        sourceButtons = sourceButton.children;
                        // Find the right button that was expanded
                        const rightButtonStartIndex = collapsedMenuButton
                            ? 1
                            : 0;
                        parentButtonData =
                            children[
                                rightButtonStartIndex +
                                    expandedMenu.expandedButtonIndex
                            ];
                        keyPrefix = `right-child-${expandedMenu.expandedButtonIndex}`;
                    }
                }

                if (sourceButtons.length > 0 && parentButtonData) {
                    const expandedChildren = renderExpandedMenu(
                        sourceButtons,
                        parentButtonData,
                        keyPrefix,
                    );
                    children.push(...expandedChildren);
                }
            }

            // Add content if provided - should fill the space above the buttons
            if (props.content) {
                // Calculate the maximum height of the button bar
                const buttonBarHeight = Math.max(
                    collapsedMenuSize?.height || 0,
                    rightSize.maxHeight,
                );
                const contentHeight =
                    constraints.height - buttonBarHeight - spacing;
                const contentConstraints = {
                    width: constraints.width,
                    height: Math.max(0, contentHeight),
                };

                const contentSize = measureDescriptor(
                    "content",
                    props.content,
                    contentConstraints,
                );

                children.push({
                    offset: { x: 0, y: 0 },
                    size: contentSize,
                    ...props.content,
                });
            }

            return {
                children: children,
                size: { width: constraints.width, height: constraints.height },
            };
        }
    },
);
