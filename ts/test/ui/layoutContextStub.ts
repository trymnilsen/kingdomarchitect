import { Sprite2 } from "../../src/asset/sprite";
import { TextStyle } from "../../src/rendering/text/textStyle";
import { UILayoutContext } from "../../src/ui/uiLayoutContext";
import { UISize } from "../../src/ui/uiSize";
import { UIView } from "../../src/ui/uiView";

/**
 * A test layout context. Implementation should not be depended upon.
 */
export class LayoutContextStub implements UILayoutContext {
    measureText(text: string, textStyle: TextStyle): UISize {
        return { width: 0, height: 0 };
    }
    measureSprite(sprite: Sprite2): UISize {
        return {
            width: sprite.defintion.w,
            height: sprite.defintion.h,
        };
    }
}

/**
 * A helper method for laying out UI. Will create a stub context layout
 * and run transform updates after layout
 * @param constraints the wanted incomming constraints
 */
export function doTestLayout(view: UIView, constraints: UISize) {
    view.layout(new LayoutContextStub(), constraints);
    view.updateTransform();
}
