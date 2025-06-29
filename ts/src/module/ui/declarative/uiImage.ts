import type { Sprite2 } from "../../asset/sprite.js";
import { createComponent, type ComponentDescriptor } from "./ui.js";

export type UiImageProps = {
    sprite: Sprite2;
    width: number;
    height: number;
};

export const uiImage = createComponent<UiImageProps>(
    ({ props, withDraw }) => {
        withDraw((scope, region) => {
            scope.drawSprite({
                sprite: props.sprite,
                x: region.x,
                y: region.y,
                width: props.width,
                height: props.height,
            });
        });

        return {
            children: [],
            size: {
                width: props.width,
                height: props.height,
            },
        };
    },
    { displayName: "UiImage" },
);
