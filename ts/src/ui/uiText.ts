import { createUiComponent } from "./component.js";

export type UiTextProps = {
    content: string;
};
export const uiText = createUiComponent<UiTextProps>(({}) => {});
