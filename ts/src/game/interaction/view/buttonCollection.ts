import { UIActionbarItem } from "./uiActionbar.ts";

export type ButtonCollection = {
    left: ReadonlyArray<UIActionbarItem>;
    right: ReadonlyArray<UIActionbarItem>;
};
