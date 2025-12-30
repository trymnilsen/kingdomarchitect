import { Sprite2 } from "../../src/asset/sprite.ts";
import { UILayoutScope } from "../../src/ui/uiLayoutContext.ts";
import { UISize } from "../../src/ui/uiSize.ts";
import { UIView } from "../../src/ui/uiView.ts";

/**
 * A test layout context. Implementation should not be depended upon.
 */
export class LayoutContextStub implements UILayoutScope {
    measureText(): UISize {
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
