/**
 * A test layout context. Implementation should not be depended upon.
 */ export class LayoutContextStub {
    measureText(text, textStyle) {
        return {
            width: 0,
            height: 0
        };
    }
    measureSprite(sprite) {
        return {
            width: sprite.defintion.w,
            height: sprite.defintion.h
        };
    }
}
/**
 * A helper method for laying out UI. Will create a stub context layout
 * and run transform updates after layout
 * @param constraints the wanted incomming constraints
 */ export function doTestLayout(view, constraints) {
    view.layout(new LayoutContextStub(), constraints);
    view.updateTransform();
}
