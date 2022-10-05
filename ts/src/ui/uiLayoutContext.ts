import { UISize } from "./uiView";

export interface UILayoutContext {
    measureText(text: string): UISize;
}
