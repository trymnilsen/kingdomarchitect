import type { TextStyle } from "../../../src/rendering/text/textStyle.ts";
import type {
    ComponentContext,
    ComponentDescriptor,
    LayoutResult,
    Rectangle,
    UISize,
} from "../../../src/ui/declarative/ui.ts";
import type { RenderScope } from "../../../src/rendering/renderScope.ts";

export type TextDrawCall = {
    text: string;
    x: number;
    y: number;
    font: string;
    size: number;
    color: string;
};

export type SpriteDrawCall = {
    spriteId: string;
    bin: string;
    x: number;
    y: number;
    targetWidth: number;
    targetHeight: number;
    clipped: boolean;
    clipBounds?: { x1: number; y1: number; x2: number; y2: number };
};

export type GestureCapture = {
    eventType: string;
    handler: Function;
};

export type DrawCapture = {
    textCalls: TextDrawCall[];
    spriteCalls: SpriteDrawCall[];
    gestures: GestureCapture[];
};

export type TestContextResult<P extends {}> = {
    context: ComponentContext<P>;
    drawCapture: DrawCapture;
    executeDrawCalls: (region: Rectangle) => void;
};

/**
 * Configuration for the test context's text measurement.
 * Using fixed dimensions makes tests predictable and deterministic.
 */
export type TextMeasureConfig = {
    charWidth: number;
    lineHeight: number;
};

/**
 * Options for creating a test component context.
 */
export type TestContextOptions = {
    measureConfig?: TextMeasureConfig;
    /** Pre-seed withState return values by call order (index 0 = first call). */
    initialStateValues?: unknown[];
    /** Custom measureDescriptor — overrides the default {0,0} stub. */
    measureDescriptorFn?: (
        slotId: any,
        descriptor: ComponentDescriptor,
        constraints: UISize,
    ) => UISize;
};

const defaultMeasureConfig: TextMeasureConfig = {
    charWidth: 8,
    lineHeight: 16,
};

/**
 * Creates a mock ComponentContext for testing declarative UI components.
 * Text measurement uses fixed character width for predictable results.
 *
 * @param props - The props to pass to the component
 * @param constraints - The layout constraints (available width/height)
 * @param options - Optional configuration for measurement and state seeding
 */
export function createTestComponentContext<P extends {}>(
    props: P,
    constraints: UISize,
    options: TestContextOptions = {},
): TestContextResult<P> {
    const measureConfig = options.measureConfig ?? defaultMeasureConfig;
    const drawCapture: DrawCapture = {
        textCalls: [],
        spriteCalls: [],
        gestures: [],
    };

    let capturedDrawFn:
        | ((scope: RenderScope, region: Rectangle) => void)
        | null = null;

    const measureText = (text: string, _style: TextStyle): UISize => ({
        width: text.length * measureConfig.charWidth,
        height: measureConfig.lineHeight,
    });

    let stateCallIndex = 0;

    const context: ComponentContext<P> = {
        props,
        constraints,
        measureText,
        measureDescriptor: (slotId, descriptor, measureConstraints) => {
            if (options.measureDescriptorFn) {
                return options.measureDescriptorFn(
                    slotId,
                    descriptor,
                    measureConstraints,
                );
            }
            return { width: 0, height: 0 };
        },
        withState: <T>(
            initial: T,
        ): [T, (newValue: T | ((current: T) => T)) => void] => {
            const callIndex = stateCallIndex++;
            const seeded = options.initialStateValues?.[callIndex];
            const value = seeded !== undefined ? (seeded as T) : initial;
            return [value, () => {}];
        },
        withDraw: (fn) => {
            capturedDrawFn = fn;
        },
        withEffect: () => {},
        withRemember: <T>(factory: () => T) => factory(),
        withGesture: (eventType, handler, _hitTest) => {
            drawCapture.gestures.push({ eventType, handler });
        },
    };

    const executeDrawCalls = (region: Rectangle) => {
        if (capturedDrawFn) {
            const mockRenderScope = createMockRenderScope(drawCapture);
            capturedDrawFn(mockRenderScope as RenderScope, region);
        }
    };

    return { context, drawCapture, executeDrawCalls };
}

/**
 * Creates a minimal mock RenderScope that captures draw calls.
 */
function createMockRenderScope(drawCapture: DrawCapture): Partial<RenderScope> {
    let currentClip: { x1: number; y1: number; x2: number; y2: number } | null =
        null;

    const scope: Partial<RenderScope> = {
        drawScreenspaceText: (config: {
            text: string;
            x: number;
            y: number;
            font: string;
            size: number;
            color: string;
        }) => {
            drawCapture.textCalls.push({
                text: config.text,
                x: config.x,
                y: config.y,
                font: config.font,
                size: config.size,
                color: config.color,
            });
        },
        drawScreenSpaceSprite: (config: {
            sprite: { bin: string; spriteId: string };
            x: number;
            y: number;
            targetWidth?: number;
            targetHeight?: number;
        }) => {
            drawCapture.spriteCalls.push({
                spriteId: config.sprite.spriteId,
                bin: config.sprite.bin,
                x: config.x,
                y: config.y,
                targetWidth: config.targetWidth ?? 0,
                targetHeight: config.targetHeight ?? 0,
                clipped: currentClip !== null,
                clipBounds: currentClip ?? undefined,
            });
        },
        drawWithClip: (
            bounds: { x1: number; y1: number; x2: number; y2: number },
            fn: (scope: RenderScope) => void,
        ) => {
            currentClip = bounds;
            fn(scope as RenderScope);
            currentClip = null;
        },
    };

    return scope;
}

/**
 * Helper to render a component and get its layout result.
 * This executes the component's render function with the test context.
 */
export function renderComponent<P extends {}>(
    component: (props: P) => ComponentDescriptor<P>,
    props: P,
    constraints: UISize,
    options?: TestContextOptions,
): {
    result: LayoutResult | ComponentDescriptor;
    drawCapture: DrawCapture;
    executeDrawCalls: (region: Rectangle) => void;
} {
    const descriptor = component(props);
    const { context, drawCapture, executeDrawCalls } =
        createTestComponentContext(props, constraints, options);

    const result = descriptor.renderFn(context);

    return { result, drawCapture, executeDrawCalls };
}

/**
 * Type guard to check if render output is a LayoutResult.
 */
export function isLayoutResult(
    value: LayoutResult | ComponentDescriptor,
): value is LayoutResult {
    return (
        value !== null &&
        typeof value === "object" &&
        "size" in value &&
        "children" in value &&
        Array.isArray(value.children)
    );
}

/**
 * Reads the children from a ComponentDescriptor (via props.children)
 * or from a LayoutResult (via .children).
 */
export function getDescriptorChildren(
    value: ComponentDescriptor | LayoutResult,
): ComponentDescriptor[] {
    if (isLayoutResult(value)) {
        return value.children as ComponentDescriptor[];
    }
    const children = (value.props as any).children;
    if (Array.isArray(children)) {
        return children as ComponentDescriptor[];
    }
    return [];
}

/**
 * Reads the content prop from a uiText-style descriptor.
 */
export function getDescriptorText(
    descriptor: ComponentDescriptor,
): string | undefined {
    return (descriptor.props as any).content as string | undefined;
}

/**
 * Helper to create standard constraints for testing.
 */
export function createConstraints(width: number, height: number): UISize {
    return { width, height };
}

/**
 * Helper to create a test text style.
 */
export function createTestTextStyle(
    font: string = "TestFont",
    size: number = 12,
    color: string = "#000000",
): TextStyle {
    return { font, size, color };
}
