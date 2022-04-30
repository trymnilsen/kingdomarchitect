import { ImageConfiguration } from "../../rendering/items/image";
import { RectangleConfiguration } from "../../rendering/items/rectangle";
import { RenderItemConfiguration } from "../../rendering/items/renderItemConfiguration";
import { assets } from "../../asset/assets";
import { TextConfiguration } from "../../rendering/items/text";
export type LayoutNode = LayoutNodeConfiguration & LayoutNodeBase;

type LayoutNodeConfiguration =
    | LayoutRectangleNode
    | LayoutImageNode
    | LayoutTextNode
    | LayoutGroupNode;

type LayoutNodeBase = {
    x: number;
    y: number;
    width: number;
    height: number;
    children: LayoutNode[];
    onTap?: () => unknown | null;
};

type LayoutRectangleNode = {
    type: typeof RectangleNodeType;
    configuration: {
        fill?: string;
        strokeWidth?: number;
        strokeColor?: string;
    };
};

type LayoutTextNode = {
    type: typeof TextNodeType;
    configuration: Omit<TextConfiguration, keyof RenderItemConfiguration>;
};

type LayoutGroupNode = {
    type: typeof GroupNodeType;
};

type LayoutImageNode = {
    type: typeof ImageNodeType;
    configuration: {
        image: keyof typeof assets;
    };
};

const GroupNodeType = "GROUP";
const RectangleNodeType = "RECTANGLE";
const ImageNodeType = "IMAGE";
const TextNodeType = "TEXT";
