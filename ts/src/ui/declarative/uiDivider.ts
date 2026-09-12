import { fillUiSize } from "../uiSize.ts";
import { createComponent } from "./ui.ts";

export type UiDividerProps = {
    color: string;
    /** Thickness of the drawn line in pixels. Defaults to 1. */
    thickness?: number;
    /** Width to span. Defaults to filling the parent. */
    width?: number;
    /** Vertical space taken. Defaults to the thickness, so the line sits flush. */
    height?: number;
};

/**
 * A dotted horizontal rule. Dotted because it splits one list into two states,
 * where a solid rule would read as the edge of a panel.
 */
export const uiDivider = createComponent<UiDividerProps>(
    ({ props, withDraw, constraints }) => {
        const thickness = props.thickness ?? 1;
        const requestedWidth = props.width ?? fillUiSize;
        const width =
            requestedWidth === fillUiSize ? constraints.width : requestedWidth;
        const height = props.height ?? thickness;

        withDraw((scope, region) => {
            const y = region.y + height / 2;
            scope.drawDottedLine(
                region.x,
                y,
                region.x + width,
                y,
                props.color,
                thickness,
            );
        });

        return {
            size: { width, height },
            children: [],
        };
    },
    { displayName: "UiDivider" },
);
