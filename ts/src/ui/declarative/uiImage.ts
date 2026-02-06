import type { SpriteRef } from "../../asset/sprite.ts";
import { createComponent } from "./ui.ts";

export type UiImageProps = {
    sprite: SpriteRef;
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
