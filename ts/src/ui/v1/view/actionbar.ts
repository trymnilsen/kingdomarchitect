import { Point } from "../../../common/point";
import { addChild } from "../layout/layout";
import { LayoutContext } from "../layout/layoutContext";
import { LayoutNode } from "../layout/layoutNode";

export interface ActionButton {
    name: string;
    id: string;
}

export function actionbarView(
    layoutContext: LayoutContext,
    actions: ActionButton[]
): LayoutNode {
    const buttonAsset = layoutContext.assetLoader.getAsset("stoneSlateButton");
    const buttonWidth = buttonAsset.width;
    const buttonHeight = buttonAsset.height;
    const buttonPadding = 16;
    const buttonMargin = 64;

    const y = layoutContext.height - buttonHeight - buttonMargin;
    let groupWidth = actions.length * (buttonWidth + buttonPadding);
    const container: LayoutNode = {
        x: buttonMargin,
        y: y,
        width: groupWidth,
        height: buttonHeight + 24,
        children: [],
        type: "GROUP",
    };

    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const button = actionbarViewButton(
            {
                x: i * (buttonWidth + buttonPadding),
                y: 0,
            },
            buttonWidth,
            buttonHeight + 24,
            action
        );
        addChild(container, button);
    }

    return container;
}

function actionbarViewButton(
    position: Point,
    width: number,
    height: number,
    action: ActionButton
): LayoutNode {
    const container: LayoutNode = {
        x: position.x,
        y: position.y,
        width: width,
        height: height,
        children: [],
        type: "GROUP",
        onTap: () => action.id,
    };

    const image: LayoutNode = {
        x: 0,
        y: 0,
        width: width,
        height: height,
        type: "IMAGE",
        configuration: {
            image: "stoneSlateButton",
        },
        children: [],
    };

    const text: LayoutNode = {
        type: "TEXT",
        x: 0,
        y: height - 20,
        width: width,
        height: 20,
        children: [],
        configuration: {
            width: width,
            align: "center",
            color: "white",
            weight: "bold",
            font: "arial",
            size: 14,
            text: action.name,
        },
    };

    addChild(container, image);
    addChild(container, text);

    return container;
}
