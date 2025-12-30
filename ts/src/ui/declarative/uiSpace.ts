import { createComponent } from "./ui.ts";

export type UiSpaceProps = {
    width?: number;
    height?: number;
};

export const uiSpace = createComponent<UiSpaceProps>(
    ({ props }) => {
        return {
            size: { width: props.width ?? 1, height: props.height ?? 1 },
            children: [],
        };
    },
    { displayName: "UiSpace" },
);
