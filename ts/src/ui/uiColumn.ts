import { createUiComponent, type ComponentDescriptor } from "./component.js";
import { setLayoutOffset } from "./layout.js";

export type UiColumnProps = {
    children: ComponentDescriptor[];
};

export const uiColumn = createUiComponent<UiColumnProps>(
    ({ props, withLayout }) => {
        withLayout((constraints, node, layout) => {
            //Number of children
            const numberOfChildren = node.children.length;
            const sizePerItem = constraints.height / numberOfChildren;
            let totalHeight = 0;
            for (const child of node.children) {
                const childSize = layout(
                    { width: constraints.width, height: sizePerItem },
                    child,
                );
                setLayoutOffset(child, { x: 0, y: totalHeight });
                totalHeight += childSize.height;
            }

            return {
                width: constraints.width,
                height: constraints.height,
            };
        });
        return props.children;
    },
);
