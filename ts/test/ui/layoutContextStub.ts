import type { Sprite2 } from "../../src/asset/sprite.js";
import type { UILayoutScope } from "../../src/ui/uiLayoutContext.js";
import type { UISize } from "../../src/ui/uiSize.js";

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
