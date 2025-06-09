//import { App } from "./app.js";

import type { Sides } from "../common/sides.js";
import { AssetLoader } from "../module/asset/loader/assetLoader.js";
import { Camera } from "../rendering/camera.js";
import { Renderer } from "../rendering/renderer.js";
import { defaultTextStyle } from "../rendering/text/textStyle.js";
import { createUiComponent, type ComponentDescriptor } from "./component.js";
import { UiRenderer } from "./render.js";
import { uiBox } from "./uiBox.js";
import { uiButton } from "./uiButton.js";
import { uiColumn } from "./uiColumn.js";
import { uiText } from "./uiText.js";

const root = createUiComponent(({ withEffect }) => {
    withEffect(() => {
        console.log("HUD created");
    });

    return uiColumn({
        children: [
            //TODO: These uiBoxes seems to get both children, some bug in reconcile here
            //The bug is that the reconciliation of the second uiBox looks at
            //the children of parent (uiColumn) and finds a single uiBox, the
            //red one. It takes this and fills it with the descriptor of the blue
            //this will add the child of this to that box.
            //Fixes:
            //- The reconciliation should use the previous output, (stored on node?).hmmm but we want the node not the descriptor
            //- We should remove the node or mark it when it has been "reconciled" to avoid picking the same first node for both red and blue uibox
            uiBox({
                child: uiText({ content: "test", textStyle: defaultTextStyle }),
                padding: 16,
                color: "red",
            }),
            uiBox({
                child: uiColumn({
                    children: [
                        uiText({
                            content: "foobar",
                            textStyle: defaultTextStyle,
                        }),
                        uiButton(),
                    ],
                }),
                padding: 16,
                color: "blue",
            }),
        ],
    });
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
        uiRender.renderComponent(root());
    },
    false,
);
