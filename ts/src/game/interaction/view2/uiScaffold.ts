import { allSides } from "../../../common/sides.js";
import { sprites2 } from "../../../module/asset/sprite.js";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "../../../module/ui/declarative/ui.js";
import { uiBox } from "../../../module/ui/declarative/uiBox.js";
import {
    CrossAxisAlignment,
    uiColumn,
} from "../../../module/ui/declarative/uiSequence.js";
import { uiText } from "../../../module/ui/declarative/uiText.js";
import { ninePatchBackground } from "../../../module/ui/dsl/uiBackgroundDsl.js";
import {
    wrapUiSize,
    zeroSize,
    type UISize,
} from "../../../module/ui/uiSize.js";
import { actionbarTextStyle } from "../../../rendering/text/textStyle.js";

type UiButtonProps = {
    label: string;
    onClick: () => void;
};
const uiMenuButton = createComponent<UiButtonProps>(
    ({ props, withGesture }) => {
        withGesture("tap", (_event) => {
            console.log(`Menu button tapped: ${props.label}`);
            props.onClick();
            // Handle the tap event, e.g., open a menu or perform an action
            return true; // Indicate that the event was handled
        });
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
                }),
                uiBox({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    padding: 8,
                    child: uiText({
                        textStyle: actionbarTextStyle,
                        content: props.label,
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

const leftButtonLabels = ["Move", "Stash", "Skills", "Stats", "Close"];
const rightButtonLabels = ["Main", "Other"];
enum MenuState {
    closed,
    left,
    main,
    other,
}

type MeasuredButtons = {
    totalWidth: number;
    maxHeight: number;
    sizes: UISize[];
};

const spacing = 8;

type ScaffoldProps = {
    onClick: () => void;
};

export const uiScaffold = createComponent<ScaffoldProps>(
    ({ constraints, measureDescriptor, withState, withEffect, props }) => {
        withEffect(() => {
            console.log("mounted");
        });
        const [menuState, setMenuState] = withState(MenuState.closed);
        const leftButtons = leftButtonLabels.map((label) =>
            uiMenuButton({ label, onClick: props.onClick }),
        );
        const rightButtons = rightButtonLabels.map((label) =>
            uiMenuButton({ label, onClick: props.onClick }),
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
                sizes.push(buttonSize);
            }
            return { totalWidth, maxHeight, sizes };
        };

        const leftSize = measureButtons(leftButtons);
        const rightSize = measureButtons(rightButtons);

        //Both fit, lay them out normally
        const width = leftSize.totalWidth + rightSize.totalWidth;
        const height = Math.max(leftSize.maxHeight, rightSize.maxHeight);
        const betweenSize =
            (leftButtons.length - 1 + rightButtons.length - 1) * spacing;
        if (width + betweenSize <= constraints.width) {
            let buttonX = 0;
            const left = leftButtons.map<PlacedChild>((button, index) => {
                const buttonSize = leftSize.sizes[index];
                const y = constraints.height - buttonSize.height;
                const x = buttonX;
                buttonX += buttonSize.width + spacing;
                return {
                    offset: { x, y },
                    ...button,
                };
            });

            const mainButton: PlacedChild = Object.assign(rightButtons[0], {
                offset: {
                    x: constraints.width - rightSize.totalWidth - spacing,
                    y: constraints.height - rightSize.sizes[0].height,
                },
            });

            const otherButton: PlacedChild = Object.assign(rightButtons[1], {
                offset: {
                    x: constraints.width - rightSize.sizes[1].width,
                    y: constraints.height - rightSize.sizes[1].height,
                },
            });

            const menu: PlacedChild[] = [];
            switch (menuState) {
                case MenuState.left:
                    break;
                case MenuState.main:
                    break;
                case MenuState.other:
                    break;
                default:
                    break;
            }

            return {
                children: [...left, ...menu, mainButton, otherButton],
                size: { width, height },
            };
        } else {
            return { children: [], size: zeroSize() };
        }
    },
);
