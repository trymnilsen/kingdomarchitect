import { allSides, type Sides } from "../common/sides.js";
import { AssetLoader } from "../module/asset/loader/assetLoader.js";
import { sprites2 } from "../module/asset/sprite.js";
import { ninePatchBackground } from "../module/ui/dsl/uiBackgroundDsl.js";
import { uiAlignment } from "../module/ui/uiAlignment.js";
import { SpriteBackground } from "../module/ui/uiBackground.js";
import { fillUiSize, wrapUiSize, zeroSize } from "../module/ui/uiSize.js";
import { Camera } from "../rendering/camera.js";
import { Renderer } from "../rendering/renderer.js";
import { defaultTextStyle } from "../rendering/text/textStyle.js";
import {
    createComponent,
    PlacedChild,
    UiRenderer,
    type ComponentDescriptor,
    type UISize,
} from "./ui.js";
import { uiBox } from "./uiBox.js";
import { CrossAxisAlignment, uiColumn, uiRow } from "./uiSequence.js";
import { uiText } from "./uiText.js";

const uiMenuButton = createComponent<{ label: string }>(({ props }) => {
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
                child: uiText({
                    content: props.label,
                }),
                background: ninePatchBackground({
                    sprite: sprites2.book_grid_item_gray,
                    sides: allSides(8),
                }),
            }),
        ],
    });
});

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

const scaffold = createComponent(
    ({ constraints, measureDescriptor, withState }) => {
        const [menuState, setMenuState] = withState(MenuState.closed);
        const leftButtons = leftButtonLabels.map((label) =>
            uiMenuButton({ label }),
        );
        const rightButtons = rightButtonLabels.map((label) =>
            uiMenuButton({ label }),
        );

        function measureButtons(
            descriptors: ComponentDescriptor[],
        ): MeasuredButtons {
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
        }

        const leftSize = measureButtons(leftButtons);
        const rightSize = measureButtons(rightButtons);

        //Both fit, lay them out normally
        const width = leftSize.totalWidth + rightSize.totalWidth;
        const height = Math.max(leftSize.maxHeight, rightSize.maxHeight);
        if (width <= constraints.width) {
            let buttonX = 0;
            const left = leftButtons.map<PlacedChild>((button, index) => {
                const buttonSize = leftSize.sizes[index];
                const y = constraints.height - buttonSize.height;
                const x = buttonX + buttonSize.width;
                buttonX = x;
                return {
                    offset: { x, y },
                    descriptor: button,
                };
            });

            const mainButton: PlacedChild = {
                descriptor: rightButtons[0],
                offset: {
                    x: constraints.width - rightSize.totalWidth,
                    y: constraints.height - rightSize.sizes[0].height,
                },
            };
            const otherButton: PlacedChild = {
                descriptor: rightButtons[1],
                offset: {
                    x: constraints.width - rightSize.sizes[1].width,
                    y: constraints.height - rightSize.sizes[1].height,
                },
            };

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

const root = createComponent(() => {
    return scaffold();
});

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const assetLoader = new AssetLoader();
        // Rendering
        const camera = new Camera({
            x: window.innerWidth,
            y: window.innerHeight,
        });

        const canvasElement: HTMLCanvasElement | null =
            document.querySelector(`#gameCanvas`);

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }

        const renderer = new Renderer(canvasElement, assetLoader, camera);
        const uiRender = new UiRenderer(renderer.context);

        canvasElement.addEventListener("mousedown", (event) => {
            console.log("Dispatcing event", event);
            //uiRender.dispatchInput(event.x, event.y);
        });

        uiRender.renderComponent(root());
    },
    false,
);
