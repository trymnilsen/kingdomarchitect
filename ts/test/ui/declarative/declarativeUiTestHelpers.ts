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

export type DrawCapture = {
    textCalls: TextDrawCall[];
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
 * @param measureConfig - Optional config for text measurement dimensions
 */
export function createTestComponentContext<P extends {}>(
    props: P,
    constraints: UISize,
    measureConfig: TextMeasureConfig = defaultMeasureConfig,
): TestContextResult<P> {
    const drawCapture: DrawCapture = {
        textCalls: [],
    };

    let capturedDrawFn: ((scope: RenderScope, region: Rectangle) => void) | null =
        null;

    const measureText = (text: string, _style: TextStyle): UISize => ({
        width: text.length * measureConfig.charWidth,
        height: measureConfig.lineHeight,
    });

    const context: ComponentContext<P> = {
        props,
        constraints,
        measureText,
        measureDescriptor: (_slotId, _descriptor, _measureConstraints) => {
            return { width: 0, height: 0 };
        },
        withState: <T>(initial: T): [T, (newValue: T | ((current: T) => T)) => void] => {
            return [initial, () => {}];
        },
        withDraw: (fn) => {
            capturedDrawFn = fn;
        },
        withEffect: () => {},
        withRemember: <T>(factory: () => T) => factory(),
        withGesture: () => {},
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
    return {
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
    };
}

/**
 * Helper to render a component and get its layout result.
 * This executes the component's render function with the test context.
 */
export function renderComponent<P extends {}>(
    component: (props: P) => ComponentDescriptor<P>,
    props: P,
    constraints: UISize,
    measureConfig?: TextMeasureConfig,
): {
    result: LayoutResult | ComponentDescriptor;
    drawCapture: DrawCapture;
    executeDrawCalls: (region: Rectangle) => void;
} {
    const descriptor = component(props);
    const { context, drawCapture, executeDrawCalls } = createTestComponentContext(
        props,
        constraints,
        measureConfig,
    );

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
