/*
import type { Key } from "./declarative.js";

// --- Primitive UI Components ---
export const uiText = (props: {
    text: string;
    key?: Key;
    modifier?: UIModifier;
    color?: string;
}): UIElement => ({ type: "uiText", props, key: props.key });

export const uiButton = (props: {
    text: string;
    onClick: () => void;
    key?: Key;
    modifier?: UIModifier;
    color?: string;
}): UIElement => ({ type: "uiButton", props, key: props.key });

export const uiColumn = (props: {
    children: Array<UIElement | null | undefined | false>;
    key?: Key;
    modifier?: UIModifier;
}): UIElement => ({
    type: "uiColumn",
    props: {
        ...props,
        children: (props.children?.filter(Boolean) as UIElement[]) || [],
    },
    key: props.key,
});

export const uiBox = (props: {
    children: Array<UIElement | null | undefined | false>;
    key?: Key;
    modifier?: UIModifier;
}): UIElement => ({
    type: "uiBox",
    props: {
        ...props,
        children: (props.children?.filter(Boolean) as UIElement[]) || [],
    },
    key: props.key,
});

interface UIModifier {
    padding?:
        | number
        | { top?: number; right?: number; bottom?: number; left?: number };
    background?: string;
    onClick?: () => void; // For interactive elements
    width?: number;
    height?: number;
    // Add more as needed, e.g., alignment for layouts
}

export const uiModifier = (...modifiers: UIModifier[]): UIModifier => {
    return modifiers.reduce((acc, mod) => ({ ...acc, ...mod }), {});
};

export const uiPadding = (
    padding:
        | number
        | { top?: number; right?: number; bottom?: number; left?: number },
): UIModifier => {
    if (typeof padding === "number") {
        return {
            padding: {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            },
        };
    }
    return { padding };
};

export const uiBackground = (color: string): UIModifier => {
    return { background: color };
};
*/
