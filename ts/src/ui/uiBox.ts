import { createUiComponent, type ComponentDescriptor } from "./component.js";

type UiBoxProps = {
    child: ComponentDescriptor;
    padding: number;
    color: string;
};

export const uiBox = createUiComponent<UiBoxProps>(
    ({ props, withLayout, withDraw }) => {
        withLayout((constraints, node, layout) => {
            const width = constraints.width - props.padding;
            const height = constraints.height - props.padding;

            if (node.children.length == 1) {
                layout({ width, height }, node.children[0]);
            }

            return {
                width: constraints.width,
                height: constraints.height,
            };
        });

        withDraw((scope, region) => {
            scope.drawScreenSpaceRectangle({
                x: region.x,
                y: region.y,
                width: region.width,
                height: region.height,
                fill: props.color,
            });
        });

        return props.child;
    },
);
