import type { Sprite2 } from "../../asset/sprite.js";
import { createComponent } from "./ui.js";

export type UiImageProps = {
    sprite: Sprite2;
    width: number;
    height: number;
};

export const uiImage = createComponent<UiImageProps>(
    ({ props, withDraw }) => {
        withDraw((scope, region) => {
            scope.drawScreenSpaceSprite({
                sprite: props.sprite,
                x: region.x,
                y: region.y,
                targetWidth: props.width,
                targetHeight: props.height,
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
