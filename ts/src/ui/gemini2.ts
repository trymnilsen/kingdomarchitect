// --- Core Types and Symbols ---

// Symbol to identify our custom component elements
const COMPONENT_ELEMENT_TYPE = Symbol.for("myui.component_element");

// Describes a component element (output of a component factory)
interface ComponentElement<P = any> {
    $$typeof: typeof COMPONENT_ELEMENT_TYPE;
    type: ComponentType<P>; // The original component type (the factory itself)
    renderFn: RenderFunction<P>; // The function containing hooks and returning a PrimitiveDescriptor
    props: P;
    key?: string | number; // For list reconciliation
}

// Describes a primitive UI element (output of uiColumn, uiText, etc.)
interface PrimitiveDescriptor {
    type: string; // e.g., 'column', 'text', 'button'
    props: {
        children?: (ComponentElement | PrimitiveDescriptor | null)[]; // Allow null for easier conditional rendering
        [key: string]: any;
    };
}

// The function containing component logic and hooks
type RenderFunction<P = any> = (props: P) => PrimitiveDescriptor;

// The type for a component factory function (returned by createComponent)
type ComponentType<P = any> = (props: P) => ComponentElement<P>;

// Represents an instance of a component in the tree (manages state/hooks)
interface ComponentNode {
    id: string; // Unique ID for this node instance
    element: ComponentElement; // The element that created this node
    hooks: any[]; // Stores hook states
    primitiveOutput?: PrimitiveDescriptor; // Cached output of the renderFn
    _markedForKeep: boolean; // Flag for garbage collection / unmounting
    // In a real framework: parent, children links, etc.
}

// --- Global State for Hooks (Implicit Magic!) ---
let currentlyRenderingNode: ComponentNode | null = null;
let currentHookIndex: number = 0;

// --- Hook Implementations ---

/**
 * useState hook: Manages state within a component.
 */
export function useState<S>(
    initialState: S | (() => S),
): [S, (newState: S | ((prevState: S) => S)) => void] {
    if (!currentlyRenderingNode) {
        throw new Error(
            "useState can only be called inside a component's render function.",
        );
    }
    const node = currentlyRenderingNode;
    const hookIndex = currentHookIndex++;

    if (node.hooks.length <= hookIndex) {
        // Initialize state only if it doesn't exist
        node.hooks[hookIndex] = {
            value:
                typeof initialState === "function"
                    ? (initialState as () => S)()
                    : initialState,
        };
        console.log(
            `[useState] Initialized state for node ${node.id} at index ${hookIndex} to:`,
            node.hooks[hookIndex].value,
        );
    } else {
        // Ensure the structure exists, mainly for robustness if hooks change order (though that's discouraged)
        if (
            typeof node.hooks[hookIndex] === "undefined" ||
            node.hooks[hookIndex] === null
        ) {
            node.hooks[hookIndex] = { value: undefined }; // Or handle appropriately
        }
    }

    const setState = (newState: S | ((prevState: S) => S)) => {
        // Ensure the hook state structure exists before accessing .value
        if (!node.hooks[hookIndex]) {
            console.error(
                `[setState] Error: Hook state at index ${hookIndex} for node ${node.id} is missing.`,
            );
            // Initialize defensively? Or throw? For now, log error and potentially initialize.
            node.hooks[hookIndex] = { value: undefined };
        }

        const currentState = node.hooks[hookIndex].value;
        const nextStateValue =
            typeof newState === "function"
                ? (newState as (prevState: S) => S)(currentState)
                : newState;

        if (!Object.is(currentState, nextStateValue)) {
            console.log(
                `[setState] State changing for node ${node.id} at index ${hookIndex} from:`,
                currentState,
                "to:",
                nextStateValue,
            );
            node.hooks[hookIndex].value = nextStateValue;
            // In a real framework, this would schedule a re-render for this specific node.
            console.log(
                `[setState] State changed for node ${node.id}. Requesting re-render.`,
            );
            // For this example, we'll simulate a re-render by re-calling the top-level render.
            // This is highly inefficient and just for demonstration.
            if (rootComponentElement && rootDomContainer) {
                render(rootComponentElement, rootDomContainer);
            } else {
                console.warn(
                    "Cannot trigger re-render: root component or container not set.",
                );
            }
        } else {
            console.log(
                `[setState] State update skipped for node ${node.id} at index ${hookIndex} (value is the same).`,
            );
        }
    };

    // Return the value property
    return [node.hooks[hookIndex].value as S, setState];
}

/**
 * useEffect hook: Handles side effects.
 */
export function useEffect(
    effect: () => (() => void) | void,
    deps?: any[],
): void {
    if (!currentlyRenderingNode) {
        throw new Error(
            "useEffect can only be called inside a component's render function.",
        );
    }
    const node = currentlyRenderingNode;
    const hookIndex = currentHookIndex++;

    // Ensure consistent hook structure, store deps and cleanup
    if (node.hooks.length <= hookIndex) {
        node.hooks[hookIndex] = {
            deps: undefined,
            cleanup: undefined,
            _type: "effect",
        };
    } else if (
        !node.hooks[hookIndex] ||
        node.hooks[hookIndex]._type !== "effect"
    ) {
        // Handle potential hook type mismatch if order changes (though discouraged)
        console.warn(
            `[useEffect] Hook type mismatch or missing hook at index ${hookIndex} for node ${node.id}. Reinitializing.`,
        );
        node.hooks[hookIndex] = {
            deps: undefined,
            cleanup: undefined,
            _type: "effect",
        };
    }

    const oldHookState = node.hooks[hookIndex] as {
        deps?: any[];
        cleanup?: () => void;
        _type: "effect";
    };
    let needsToRun = true;

    // Check dependencies
    if (deps) {
        // Only check deps if they are provided
        if (
            oldHookState.deps &&
            deps.length === oldHookState.deps.length &&
            deps.every((dep, i) => Object.is(dep, oldHookState.deps![i]))
        ) {
            needsToRun = false;
            console.log(
                `[useEffect] Skip effect for node ${node.id} at index ${hookIndex} (deps unchanged).`,
            );
        }
    } else {
        // If no dependency array, always run (like componentDidUpdate)
        // If it's the first run, oldHookState.deps will be undefined, so it will also run.
        console.log(
            `[useEffect] Will run effect for node ${node.id} at index ${hookIndex} (no deps array or first run/deps changed).`,
        );
    }

    if (needsToRun) {
        // Run cleanup from previous effect *before* running the new effect
        if (oldHookState.cleanup) {
            console.log(
                `[useEffect] Running cleanup for node ${node.id} at index ${hookIndex}.`,
            );
            try {
                oldHookState.cleanup();
            } catch (error) {
                console.error(
                    `[useEffect] Error during cleanup for node ${node.id} at index ${hookIndex}:`,
                    error,
                );
            }
            oldHookState.cleanup = undefined; // Ensure cleanup only runs once
        }

        // Schedule the new effect to run *after* the current render cycle completes.
        // This is closer to React's behavior. For simplicity here, we run it immediately,
        // but be aware this differs from React. A scheduler would handle this.
        console.log(
            `[useEffect] Running effect for node ${node.id} at index ${hookIndex}.`,
        );
        try {
            const cleanup = effect();
            node.hooks[hookIndex] = { deps, cleanup, _type: "effect" }; // Store new deps and cleanup
        } catch (error) {
            console.error(
                `[useEffect] Error during effect execution for node ${node.id} at index ${hookIndex}:`,
                error,
            );
            // Store deps even if effect fails, but no cleanup
            node.hooks[hookIndex] = {
                deps,
                cleanup: undefined,
                _type: "effect",
            };
        }
    } else {
        // If effect doesn't need to run, ensure the hook state object is preserved
        // (deps and cleanup remain from the previous run)
        // No action needed here as oldHookState is already node.hooks[hookIndex]
    }
}

/**
 * Runs cleanup functions for all useEffect hooks on a node.
 * @param node The component node to clean up.
 */
function runNodeCleanups(node: ComponentNode): void {
    console.log(`[Cleanup] Running cleanups for node ${node.id}`);
    node.hooks.forEach((hookState, index) => {
        // Check if it's an effect hook and has a cleanup function
        if (
            hookState &&
            hookState._type === "effect" &&
            typeof hookState.cleanup === "function"
        ) {
            console.log(
                `[Cleanup] Running useEffect cleanup for node ${node.id} at index ${index}.`,
            );
            try {
                hookState.cleanup();
                hookState.cleanup = undefined; // Prevent double cleanup
            } catch (error) {
                console.error(
                    `[Cleanup] Error during useEffect cleanup for node ${node.id} at index ${index}:`,
                    error,
                );
            }
        }
    });
}

// --- Component Creation ---

/**
 * Creates a component factory.
 * @param renderFn The function that defines the component's logic and UI.
 * This function can use hooks and returns a PrimitiveDescriptor.
 */
export function createComponent<P extends {}>(
    renderFn: RenderFunction<P>,
    options?: { displayName?: string }, // Optional display name for better debugging
): ComponentType<P> {
    const componentType = (props: P): ComponentElement<P> => {
        return {
            $$typeof: COMPONENT_ELEMENT_TYPE,
            type: componentType,
            renderFn: renderFn,
            props: props,
            key: (props as any).key, // Pass key through if provided in props
        };
    };
    // Assign display name for easier debugging
    Object.defineProperty(componentType, "name", {
        value: options?.displayName || renderFn.name || "AnonymousComponent",
        configurable: true,
    });
    return componentType;
}

// --- Primitive UI Element Builders ---

export function uiText(text: string): PrimitiveDescriptor {
    return { type: "text", props: { textContent: text } };
}

export function uiButton(props: {
    label: string;
    onClick: () => void;
}): PrimitiveDescriptor {
    return {
        type: "button",
        props: { label: props.label, onClick: props.onClick },
    };
}

// Children are passed as an array of ComponentElements or PrimitiveDescriptors
export function uiColumn(props: {
    children: (ComponentElement | PrimitiveDescriptor | null)[]; // Allow null children
}): PrimitiveDescriptor {
    // Filter out null/undefined children before returning descriptor
    const validChildren = props.children.filter((child) => child != null) as (
        | ComponentElement
        | PrimitiveDescriptor
    )[];
    return { type: "column", props: { children: validChildren } };
}

// --- Rendering Engine (Simplified) ---

// A simple registry for component nodes (fibers in React terms)
const componentNodeRegistry = new Map<string, ComponentNode>();

// For demo re-render trigger
let rootComponentElement: ComponentElement | null = null;
let rootDomContainer: any | null = null;

/**
 * Processes an element (ComponentElement or PrimitiveDescriptor) and renders/updates it.
 * This is the core of the "execute once" mechanism for component render functions.
 * @param element The element to process.
 * @param parentNodeId The ID of the parent component node (for generating stable child IDs).
 * @param index The index of this element within its parent's children (for generating stable child IDs).
 * @returns The resulting PrimitiveDescriptor or null if not applicable.
 */
function processElement(
    element: ComponentElement | PrimitiveDescriptor | null, // Allow null elements
    parentNodeId: string,
    index: number,
): PrimitiveDescriptor | null {
    // Handle null elements gracefully (often result from conditional rendering)
    if (element === null) {
        return null;
    }
    if (typeof element !== "object") {
        console.warn("Invalid element type:", element);
        return null; // Skip invalid elements
    }

    // Check if it's a ComponentElement
    if ("$$typeof" in element && element.$$typeof === COMPONENT_ELEMENT_TYPE) {
        const componentElement = element as ComponentElement;
        // Create a stable ID using parent, index, and potentially a key
        const keySuffix = componentElement.key
            ? `(${componentElement.key})`
            : `[${index}]`;
        // Use component type's name if available for better readability
        const typeName = componentElement.type.name || "AnonymousComponent";
        const componentNodeId = `${parentNodeId}/${typeName}${keySuffix}`;

        let node = componentNodeRegistry.get(componentNodeId);

        if (!node) {
            // First time rendering this component instance
            node = {
                id: componentNodeId,
                element: componentElement,
                hooks: [],
                _markedForKeep: true, // Mark as kept since it's being created
            };
            componentNodeRegistry.set(componentNodeId, node);
            console.log(`[RenderEngine] Creating node: ${node.id}`);
        } else {
            // Update existing node
            node.element = componentElement; // Update with the new element (props might have changed)
            node._markedForKeep = true; // Mark as kept during update
            console.log(`[RenderEngine] Updating node: ${node.id}`);
        }

        // Set global context for hooks
        const previousRenderingNode = currentlyRenderingNode;
        const previousHookIndex = currentHookIndex;
        currentlyRenderingNode = node;
        currentHookIndex = 0;

        let primitiveOutput: PrimitiveDescriptor | null = null;
        try {
            // *** Execute the component's render function ***
            console.log(
                `[RenderEngine] >>>> Executing renderFn for node: ${node.id} with props:`,
                componentElement.props,
            );
            primitiveOutput = componentElement.renderFn(componentElement.props);
            node.primitiveOutput = primitiveOutput; // Cache the output
            console.log(
                `[RenderEngine] <<<< Finished renderFn for node: ${node.id}`,
            );
        } catch (error) {
            console.error(
                `[RenderEngine] Error executing renderFn for node ${node.id}:`,
                error,
            );
            // How to handle render errors? Maybe render an error boundary component?
            // For now, we'll just return null, effectively removing it from the tree.
            primitiveOutput = null;
        }

        // Restore global context
        currentlyRenderingNode = previousRenderingNode;
        currentHookIndex = previousHookIndex;

        // Process the output of the component's render function (which is a primitive)
        if (primitiveOutput) {
            // Recursively process the children defined *within* the component's output primitive
            if (primitiveOutput.props.children) {
                primitiveOutput.props.children = primitiveOutput.props.children
                    .map((child, childIndex) =>
                        // Pass the component's ID as the parent ID for its children
                        processElement(child, node!.id, childIndex),
                    )
                    // Filter out nulls resulting from conditional rendering or errors
                    .filter((child) => child !== null) as PrimitiveDescriptor[];
            }
            return primitiveOutput;
        } else {
            // Component render function returned null or threw an error
            return null;
        }
    } else if ("type" in element && typeof element.type === "string") {
        // It's a PrimitiveDescriptor
        const primitiveDescriptor = element as PrimitiveDescriptor;
        console.log(
            `[RenderEngine] Processing primitive: ${primitiveDescriptor.type}`,
            // primitiveDescriptor.props, // Avoid logging potentially large children arrays
        );
        if (primitiveDescriptor.props.children) {
            // Process children of the primitive.
            // The parentNodeId remains the ID of the component *containing* this primitive.
            primitiveDescriptor.props.children =
                primitiveDescriptor.props.children
                    .map((child, childIndex) =>
                        processElement(
                            child,
                            // Important: Parent ID for children of a primitive is still the ID of the component
                            // that rendered this primitive, or the ancestor primitive's effective parent ID.
                            // Using parentNodeId directly here assumes primitives don't create new ID scopes.
                            parentNodeId,
                            childIndex, // Index within the primitive's children
                        ),
                    )
                    .filter((child) => child !== null) as PrimitiveDescriptor[];
        }
        return primitiveDescriptor;
    } else {
        console.warn(
            "[RenderEngine] Encountered invalid element structure:",
            element,
        );
        return null;
    }
}

// --- Top-Level Render Function ---

let canvasMock: {
    clear: () => void;
    draw: (desc: PrimitiveDescriptor, x: number, y: number) => number;
} | null = null;
let currentY = 0; // Used by canvasMock draw

function setupCanvasMock(targetElement: HTMLElement) {
    targetElement.innerHTML = ""; // Clear previous content
    const pre = document.createElement("pre");
    pre.style.fontFamily = "monospace";
    pre.style.whiteSpace = "pre";
    targetElement.appendChild(pre);

    canvasMock = {
        clear: () => {
            pre.textContent = "";
            currentY = 10;
        },
        draw: (desc, x, _yOffset) => {
            // yOffset is managed globally by currentY
            let height = 20; // Default height
            let indent = " ".repeat(x / 10); // Simple indentation based on x
            let content = `${indent}[${desc.type.toUpperCase()}]`;

            if (desc.type === "text") {
                content += ` Text: "${desc.props["textContent"]}"`;
                const textNode = document.createTextNode(content + "\n");
                pre.appendChild(textNode);
            } else if (desc.type === "button") {
                content += ` Label: "${desc.props["label"]}"`;
                const textNode = document.createTextNode(content + "\n");
                pre.appendChild(textNode);
                // Simulate button clickability - Create actual button
                const btn = document.createElement("button");
                btn.textContent = `${desc.props["label"]} (Live Button)`;
                btn.style.display = "block";
                btn.style.marginLeft = `${x + 10}px`; // Indent button slightly more
                btn.onclick = desc.props["onClick"];
                pre.appendChild(btn);
                height = 35; // Button takes more space + text line
            } else if (desc.type === "column") {
                content += ` (Contains children)`;
                const textNode = document.createTextNode(content + "\n");
                pre.appendChild(textNode);
                height = 15; // Column itself takes less space, children add more
            } else {
                const textNode = document.createTextNode(content + "\n");
                pre.appendChild(textNode);
            }

            currentY += height;

            // Recursively draw children, increasing indentation
            if (desc.props.children) {
                desc.props.children.forEach((child) => {
                    if (child) {
                        canvasMock!.draw(
                            child as PrimitiveDescriptor,
                            x + 20,
                            0,
                        );
                    }
                });
            }
            return height; // Return height occupied by this element + its children (implicitly handled by global currentY)
        },
    };
}

/**
 * Main render function for the application.
 * @param rootElement The root ComponentElement of the application.
 * @param container The canvas context or DOM element to render into.
 */
export function render(rootElement: ComponentElement, container: any): void {
    console.log("--- Starting Render Cycle ---");

    // 1. Mark all existing nodes as potentially removable
    console.log(
        `[Render] Marking ${componentNodeRegistry.size} existing nodes for potential removal.`,
    );
    componentNodeRegistry.forEach((node) => {
        node._markedForKeep = false;
    });

    // 2. Setup canvas mock if needed
    if (!canvasMock && container instanceof HTMLElement) {
        console.log("[Render] Setting up canvas mock.");
        setupCanvasMock(container);
        // Store root for re-renders triggered by useState
        rootComponentElement = rootElement;
        rootDomContainer = container;
    }
    canvasMock?.clear();

    // 3. Process the element tree (this marks nodes to keep)
    console.log("[Render] Processing element tree...");
    const finalDescriptorTree = processElement(rootElement, "root", 0);
    console.log("[Render] Finished processing element tree.");

    // 4. Unmount nodes that were not marked for keeping
    console.log("[Render] Cleaning up unmounted nodes...");
    const nodesToRemove: string[] = [];
    componentNodeRegistry.forEach((node) => {
        if (!node._markedForKeep) {
            console.log(`[Render] Node ${node.id} marked for removal.`);
            runNodeCleanups(node); // Run useEffect cleanup functions
            nodesToRemove.push(node.id);
        }
    });

    nodesToRemove.forEach((nodeId) => {
        componentNodeRegistry.delete(nodeId);
        console.log(`[Render] Removed node ${nodeId} from registry.`);
    });
    console.log(
        `[Render] Finished cleanup. ${nodesToRemove.length} nodes removed.`,
    );

    // 5. Draw the final tree structure to the mock canvas
    if (finalDescriptorTree && canvasMock) {
        // console.log("--- Final Descriptor Tree for Drawing ---");
        // console.log(JSON.stringify(finalDescriptorTree, null, 2)); // Can be very verbose
        console.log("[Render] Drawing to canvas mock...");
        canvasMock.draw(finalDescriptorTree, 10, 10);
        console.log("[Render] Finished drawing.");
    } else {
        console.log("[Render] No tree to draw or canvas mock not ready.");
    }
    console.log(
        `--- Render Cycle Ended (${componentNodeRegistry.size} nodes active) ---`,
    );
}

// --- Example Usage ---

// 1. Define Components using createComponent
const TextBox = createComponent<{ text: string }>(
    (props) => {
        // useEffect(() => {
        //   console.log(`TextBox [${props.text}] mounted/updated.`);
        //   return () => console.log(`TextBox [${props.text}] unmounted.`);
        // }, [props.text]); // Note: effect depends on text prop

        return uiText(props.text);
    },
    { displayName: "TextBox" },
); // Add display name

const CounterBox = createComponent<{ initialCount?: number }>(
    (props) => {
        const [count, setCount] = useState(props.initialCount ?? 0);

        // Effect runs on mount and when count changes
        useEffect(() => {
            console.log(
                `+++ CounterBox Effect: Mounted or count changed to: ${count}. Node ID: ${currentlyRenderingNode?.id}`,
            );
            // Return the cleanup function
            return () => {
                // Use the count from the closure when the effect ran
                console.log(
                    `--- CounterBox Cleanup: Unmounting or count changing from: ${count}. Node ID: ${currentlyRenderingNode?.id}`,
                );
            };
        }, [count]); // Dependency array includes count

        // Another effect just for mount/unmount demonstration
        useEffect(() => {
            console.log(
                `+++ CounterBox MOUNT Effect. Node ID: ${currentlyRenderingNode?.id}`,
            );
            return () => {
                console.log(
                    `--- CounterBox UNMOUNT Cleanup. Node ID: ${currentlyRenderingNode?.id}`,
                );
            };
        }, []); // Empty dependency array: runs only on mount, cleans up only on unmount

        return uiColumn({
            children: [
                TextBox({ text: `Count: ${count}` }),
                uiButton({
                    label: "Increment",
                    onClick: () => setCount((prev) => prev + 1), // Use functional update
                }),
                uiButton({
                    label: "Decrement",
                    onClick: () => setCount((prev) => prev - 1), // Use functional update
                }),
            ],
        });
    },
    { displayName: "CounterBox" },
); // Add display name

export const App = createComponent<{}>(
    (_props) => {
        const [counterIsVisible, setCounterIsVisible] = useState(true);

        useEffect(() => {
            console.log(
                `App Effect: counterIsVisible is now ${counterIsVisible}`,
            );
            // No cleanup needed for this effect
        }, [counterIsVisible]);

        return uiColumn({
            children: [
                TextBox({ text: "Welcome to the Declarative UI Demo!" }),
                // Conditionally render CounterBox using standard JS logic
                counterIsVisible ? CounterBox({ initialCount: 5 }) : null,
                uiButton({
                    label: counterIsVisible
                        ? "Hide Main Counter"
                        : "Show Main Counter",
                    onClick: () => setCounterIsVisible(!counterIsVisible),
                }),
                TextBox({ text: "End of App." }),
            ],
        });
    },
    { displayName: "App" },
); // Add display name

// --- Running the Demo ---

// Example of how to run in an HTML file:
/*
<!DOCTYPE html>
<html>
<head>
    <title>Declarative UI Demo</title>
</head>
<body>
    <h1>Declarative UI Demo Output</h1>
    <div id="canvas-container" style="border: 1px solid #ccc; padding: 10px; min-height: 200px;">
        </div>
    <script type="module">
        // Assuming your compiled JS code is in a file named 'framework.js'
        // Adjust the path as necessary.
        import { render, App } from './framework.js';

        document.addEventListener('DOMContentLoaded', () => {
            const appContainer = document.getElementById('canvas-container');
            if (appContainer) {
                // Initial render: App({}) creates the root element factory call
                render(App({}), appContainer);
            } else {
                console.error("Container element not found!");
            }
        });
    </script>
</body>
</html>
*/

// For self-contained execution simulation (e.g., Node.js or simple script tag without modules)
// You might need to adapt the import/export and trigger manually.
if (typeof document !== "undefined") {
    // Ensure the DOM is ready before trying to find the container
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            const appContainer =
                document.getElementById("canvas-container") ||
                document.createElement("div"); // Fallback to creating div
            if (!document.getElementById("canvas-container")) {
                appContainer.id = "canvas-container";
                document.body.appendChild(appContainer);
            }
            render(App({}), appContainer);
        });
    } else {
        // DOM already loaded
        const appContainer =
            document.getElementById("canvas-container") ||
            document.createElement("div"); // Fallback
        if (!document.getElementById("canvas-container")) {
            appContainer.id = "canvas-container";
            document.body.appendChild(appContainer);
        }
        render(App({}), appContainer);
    }
} else {
    console.log(
        "Simulating render without DOM. Call render(App({}), yourCanvasContext);",
    );
    // Simulate first render (won't show UI, but logs might work)
    render(App({}), null);
}
