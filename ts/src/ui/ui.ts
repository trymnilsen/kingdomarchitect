interface UIElement<P = any> {
    type: string | FunctionComponent<P>; // e.g., 'uiText', 'uiColumn', or a user-defined component function
    props: P & {
        key?: string;
        modifier?: UIModifier;
    };
    key?: string; // For reconciliation
}

type FunctionComponent<P = any> = (props: P) => UIElement | null;

// --- Modifiers ---
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
