import type { Sprite2 } from "../../../asset/sprite.ts";

export type UIActionbarItem = {
    text: string;
    onClick?: () => void;
    children?: ReadonlyArray<Omit<UIActionbarItem, "children">>;
    icon?: Sprite2;
};
