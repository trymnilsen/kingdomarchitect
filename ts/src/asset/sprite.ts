import { sprites } from "../../generated/sprites.ts";

export type Sprite2Id = keyof typeof sprites2;
export type Sprite2 = {
    /**
     * The reference to which spritesheet this sprite is found in
     */
    bin: string;
    /*
     * The id of the sprite
     */
    id: string;
    /**
     * The definition defines where in the spritesheet the sprite can be found
     */
    defintion: {
        frames: number;
        /**
         * The width of the sprite in the spritesheet
         */
        w: number;
        /**
         * The height of the sprite in the spritesheet
         */
        h: number;
        /**
         * The X position the sprite in the spritesheet
         */
        x: number;
        /**
         * The Y position the sprite in the spritesheet
         */
        y: number;
    };
};

export const sprites2 = sprites;
export const emptySprite = sprites.empty_sprite;
