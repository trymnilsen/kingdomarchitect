// // --- Core Types ---
// type Key = string | number;

// interface UIElement<P = any> {
//     type: string | FunctionComponent<P>; // e.g., 'uiText', 'uiColumn', or a user-defined component function
//     props: P & {
//         children?: Array<UIElement | null | undefined | false>;
//         key?: Key;
//         modifier?: UIModifier;
//     };
//     key?: Key; // For reconciliation
// }

// type FunctionComponent<P = any> = (props: P) => UIElement | null;

// // --- Modifiers ---
// interface UIModifier {
//     padding?:
//         | number
//         | { top?: number; right?: number; bottom?: number; left?: number };
//     background?: string;
//     onClick?: () => void; // For interactive elements
//     width?: number;
//     height?: number;
//     // Add more as needed, e.g., alignment for layouts
// }

// // --- Hooks & Internal Instance Data ---
// interface BaseHook {
//     type: "state" | "effect" | "memo";
// }

// interface StateHook<T> extends BaseHook {
//     type: "state";
//     value: T;
//     setValue: (newValue: T | ((prevState: T) => T)) => void;
// }

// interface EffectHook extends BaseHook {
//     type: "effect";
//     callback: () => (() => void) | void;
//     dependencies: any[] | undefined;
//     cleanup?: () => void;
//     hasRun: boolean; // To manage running effect only once if deps are []
// }

// interface MemoHook<T> extends BaseHook {
//     type: "memo";
//     value: T;
//     dependencies: any[] | undefined;
// }

// interface ComponentInstance {
//     id: string; // Unique ID for debugging or advanced scenarios
//     element: UIElement; // The UIElement that created this instance
//     componentFunction?: FunctionComponent; // If this instance is for a FunctionComponent

//     parentInstance?: ComponentInstance | null; // Reference to the parent instance in the tree

//     // For FunctionComponents, this is the instance of the element they returned
//     renderedChildInstance?: ComponentInstance | null;
//     // For host components (like uiColumn), these are instances of their children
//     renderedChildrenInstances: ComponentInstance[];

//     hooks: BaseHook[];
//     // Geometrical properties determined during layout/render pass
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//     onClick?: () => void; // Populated if element.props.onClick exists
// }

// // --- Global State for Rendering & Hooks ---
// let _currentRenderingInstance: ComponentInstance | null = null;
// let _currentHookIndex: number = 0;
// let _rootInstance: ComponentInstance | null = null;
// let _canvasCtx: CanvasRenderingContext2D | null = null;
// let _effectsToRun: Array<{ hook: EffectHook; instance: ComponentInstance }> =
//     [];
// let _nextInstanceId = 0;
// let _isUpdateScheduled = false;
// let _appRootComponent: FunctionComponent<any> | null = null;

// // --- Modifier Helpers ---
// export const uiModifier = (...modifiers: UIModifier[]): UIModifier => {
//     return modifiers.reduce((acc, mod) => ({ ...acc, ...mod }), {});
// };

// export const uiPadding = (
//     padding:
//         | number
//         | { top?: number; right?: number; bottom?: number; left?: number },
// ): UIModifier => {
//     if (typeof padding === "number") {
//         return {
//             padding: {
//                 top: padding,
//                 right: padding,
//                 bottom: padding,
//                 left: padding,
//             },
//         };
//     }
//     return { padding };
// };

// export const uiBackground = (color: string): UIModifier => {
//     return { background: color };
// };

// // --- Hook Implementations ---
// export function useState<T>(
//     initialValue: T | (() => T),
// ): [T, (newValue: T | ((prevState: T) => T)) => void] {
//     if (!_currentRenderingInstance)
//         throw new Error("useState called outside component render.");
//     const instance = _currentRenderingInstance;
//     const hookIndex = _currentHookIndex++;

//     if (instance.hooks.length <= hookIndex) {
//         // First render for this hook in this instance
//         const value =
//             typeof initialValue === "function"
//                 ? (initialValue as () => T)()
//                 : initialValue;
//         const setState = (updaterOrValue: T | ((prevState: T) => T)) => {
//             const currentHook = instance.hooks[hookIndex] as StateHook<T>;
//             const oldValue = currentHook.value;
//             const newValue =
//                 typeof updaterOrValue === "function"
//                     ? (updaterOrValue as (prevState: T) => T)(oldValue)
//                     : updaterOrValue;

//             if (!Object.is(oldValue, newValue)) {
//                 currentHook.value = newValue;
//                 scheduleRender();
//             }
//         };
//         const hook: StateHook<T> = { type: "state", value, setValue: setState };
//         instance.hooks.push(hook);
//         return [hook.value, hook.setValue];
//     } else {
//         // Subsequent renders
//         const hook = instance.hooks[hookIndex] as StateHook<T>;
//         return [hook.value, hook.setValue];
//     }
// }

// export function useEffect(
//     callback: () => (() => void) | void,
//     dependencies?: any[],
// ): void {
//     if (!_currentRenderingInstance)
//         throw new Error("useEffect called outside component render.");
//     const instance = _currentRenderingInstance;
//     const hookIndex = _currentHookIndex++;

//     const oldHook = instance.hooks[hookIndex] as EffectHook | undefined;
//     let needsRun = true;

//     if (oldHook) {
//         if (dependencies && oldHook.dependencies) {
//             needsRun =
//                 dependencies.length !== oldHook.dependencies.length ||
//                 dependencies.some(
//                     (dep, i) => !Object.is(dep, oldHook.dependencies![i]),
//                 );
//         } else if (
//             dependencies === undefined &&
//             oldHook.dependencies === undefined
//         ) {
//             // No deps array, always run
//             needsRun = true;
//         } else if (
//             dependencies?.length === 0 &&
//             oldHook.dependencies?.length === 0
//         ) {
//             // Empty deps array
//             needsRun = !oldHook.hasRun; // Run only once after first render
//         } else {
//             // Deps changed from defined to undefined or vice-versa, or length changed
//             needsRun = true;
//         }
//     }

//     if (needsRun) {
//         if (oldHook?.cleanup) {
//             // console.log(`Running cleanup for effect in ${instance.id} hook ${hookIndex}`);
//             oldHook.cleanup(); // Call cleanup from the previous effect run
//         }
//         const newHook: EffectHook = {
//             type: "effect",
//             callback,
//             dependencies,
//             cleanup: undefined,
//             hasRun: false,
//         };
//         instance.hooks[hookIndex] = newHook;
//         _effectsToRun.push({ hook: newHook, instance });
//     } else {
//         // Dependencies haven't changed, keep the old hook.
//         instance.hooks[hookIndex] = oldHook!;
//     }
// }

// export function remember<T>(calculateValue: () => T, dependencies?: any[]): T {
//     if (!_currentRenderingInstance)
//         throw new Error("remember called outside component render.");
//     const instance = _currentRenderingInstance;
//     const hookIndex = _currentHookIndex++;

//     const oldHook = instance.hooks[hookIndex] as MemoHook<T> | undefined;
//     if (oldHook) {
//         const needsRecalculation =
//             !dependencies ||
//             !oldHook.dependencies ||
//             dependencies.length !== oldHook.dependencies.length ||
//             dependencies.some(
//                 (dep, i) => !Object.is(dep, oldHook.dependencies![i]),
//             );
//         if (needsRecalculation) {
//             const value = calculateValue();
//             //@ts-expect-error
//             instance.hooks[hookIndex] = { type: "memo", value, dependencies };
//             return value;
//         }
//         return oldHook.value;
//     } else {
//         const value = calculateValue();
//         //@ts-expect-error
//         instance.hooks.push({ type: "memo", value, dependencies });
//         return value;
//     }
// }

// // --- Reconciliation ---
// function reconcile(
//     parentDomInstance: ComponentInstance | null, // The "DOM" parent, or null for root
//     prevInstance: ComponentInstance | null,
//     element: UIElement | null,
// ): ComponentInstance | null {
//     if (element === null) {
//         // Unmounting
//         if (prevInstance) {
//             // Recursively run cleanups for this instance and its children
//             runCleanupsRecursive(prevInstance);
//             // TODO: Actual canvas clearing for this element's area if needed
//             console.log(
//                 `Unmounted: ${prevInstance.id} (${(prevInstance.element.type as any).name || prevInstance.element.type})`,
//             );
//         }
//         return null;
//     }

//     const isFunctionComponent = typeof element.type === "function";
//     let instance: ComponentInstance;

//     if (prevInstance && prevInstance.element.type !== element.type) {
//         // Type changed, full unmount and mount
//         reconcile(parentDomInstance, prevInstance, null);
//         prevInstance = null;
//     }

//     if (isFunctionComponent) {
//         if (prevInstance) {
//             // Update existing FunctionComponent instance
//             instance = prevInstance;
//             instance.element = element; // Update element (new props)
//         } else {
//             // Mount new FunctionComponent instance
//             instance = {
//                 id: `fc-${_nextInstanceId++}`,
//                 element,
//                 componentFunction: element.type as FunctionComponent,
//                 hooks: [],
//                 renderedChildrenInstances: [], // FCs don't have direct children in this list
//                 parentInstance: parentDomInstance,
//                 renderedChildInstance: null, // Initialize
//                 x: 0,
//                 y: 0,
//                 width: 0,
//                 height: 0, // FCs themselves don't have geometry
//             };
//         }

//         // Prepare for running hooks for this instance
//         const previousRenderingInstance = _currentRenderingInstance;
//         const previousHookIndex = _currentHookIndex;
//         _currentRenderingInstance = instance;
//         _currentHookIndex = 0;

//         const renderedElement = (
//             instance.componentFunction as FunctionComponent
//         )(element.props);

//         // Restore previous hook context
//         _currentRenderingInstance = previousRenderingInstance;
//         _currentHookIndex = previousHookIndex;

//         // Reconcile the child element returned by the function component
//         instance.renderedChildInstance = reconcile(
//             parentDomInstance,
//             instance.renderedChildInstance || null,
//             renderedElement,
//         );
//     } else {
//         // Host component (e.g., 'uiText', 'uiColumn')
//         if (prevInstance) {
//             // Update existing host instance
//             instance = prevInstance;
//             instance.element = element;
//         } else {
//             // Mount new host instance
//             instance = {
//                 id: `host-${element.type}-${_nextInstanceId++}`,
//                 element,
//                 hooks: [], // Host components don't have user-defined hooks
//                 renderedChildrenInstances: [],
//                 parentInstance: parentDomInstance,
//                 x: 0,
//                 y: 0,
//                 width: 0,
//                 height: 0, // Geometry calculated in render pass
//             };
//         }
//         instance.onClick = element.props.onClick; // Store onClick for event handling

//         // Reconcile children of this host component
//         reconcileChildren(instance, element.props.children || []);
//     }
//     return instance;
// }

// function reconcileChildren(
//     parentInstance: ComponentInstance,
//     childElements: Array<UIElement | null | undefined | false>,
// ) {
//     const newChildrenElements = childElements.filter(Boolean) as UIElement[];
//     const prevChildInstances = parentInstance.renderedChildrenInstances;
//     const newChildInstances: ComponentInstance[] = new Array(
//         newChildrenElements.length,
//     ).fill(null);

//     const oldKeyedChildren: Map<Key, ComponentInstance> = new Map();
//     const oldUnkeyedChildren: Array<ComponentInstance | null> = []; // Allow nulls for used slots
//     prevChildInstances.forEach((child) => {
//         if (child.element.key != null) {
//             oldKeyedChildren.set(child.element.key, child);
//         } else {
//             oldUnkeyedChildren.push(child);
//         }
//     });

//     // Pass 1: Reconcile new children against old children
//     for (let i = 0; i < newChildrenElements.length; i++) {
//         const childElement = newChildrenElements[i];
//         let prevMatchingInstance: ComponentInstance | null = null;

//         if (childElement.key != null) {
//             // Keyed child
//             if (oldKeyedChildren.has(childElement.key)) {
//                 prevMatchingInstance = oldKeyedChildren.get(childElement.key)!;
//                 oldKeyedChildren.delete(childElement.key); // Mark as used for keyed map
//             }
//         } else {
//             // Unkeyed child - match by position and type if available
//             // Iterate through oldUnkeyedChildren to find a suitable match that hasn't been 'nulled'
//             for (let j = 0; j < oldUnkeyedChildren.length; j++) {
//                 const potentialMatch = oldUnkeyedChildren[j];
//                 if (
//                     potentialMatch &&
//                     potentialMatch.element.type === childElement.type
//                 ) {
//                     prevMatchingInstance = potentialMatch;
//                     oldUnkeyedChildren[j] = null; // Mark as used
//                     break;
//                 }
//             }
//         }

//         const newInstance = reconcile(
//             parentInstance,
//             prevMatchingInstance,
//             childElement,
//         );
//         if (newInstance) {
//             newChildInstances[i] = newInstance;
//         }
//     }

//     // Pass 2: Unmount any remaining old children (those not used from oldKeyedChildren or still non-null in oldUnkeyedChildren)
//     oldKeyedChildren.forEach((oldChild) =>
//         reconcile(parentInstance, oldChild, null),
//     );
//     oldUnkeyedChildren.forEach((oldChild) => {
//         if (oldChild) reconcile(parentInstance, oldChild, null);
//     });

//     parentInstance.renderedChildrenInstances = newChildInstances.filter(
//         Boolean,
//     ) as ComponentInstance[];
// }

// function runCleanupsRecursive(instance: ComponentInstance) {
//     // Run cleanups for the current instance's effects
//     instance.hooks.forEach((hook) => {
//         if (hook.type === "effect" && (hook as EffectHook).cleanup) {
//             // console.log(`Running cleanup for effect during unmount: ${instance.id} hook`);
//             (hook as EffectHook).cleanup!();
//             (hook as EffectHook).cleanup = undefined; // Avoid double cleanup
//             (hook as EffectHook).hasRun = false; // Reset hasRun status
//         }
//     });

//     // Recursively run cleanups for children
//     if (instance.renderedChildInstance) {
//         // For FunctionComponent's child
//         runCleanupsRecursive(instance.renderedChildInstance);
//     }
//     instance.renderedChildrenInstances.forEach((childInstance) => {
//         // For host component's children
//         if (childInstance) runCleanupsRecursive(childInstance);
//     });
// }

// // --- Drawing and Layout (Simplified) ---
// function drawUI(
//     ctx: CanvasRenderingContext2D,
//     instance: ComponentInstance | null,
//     currentX: number,
//     currentY: number,
// ): { width: number; height: number } {
//     if (!instance) return { width: 0, height: 0 };

//     const { element } = instance;
//     const props = element.props;
//     const modifier = props.modifier || {};

//     const PADDING_TOP =
//         typeof modifier.padding === "number"
//             ? modifier.padding
//             : modifier.padding?.top || 0;
//     const PADDING_RIGHT =
//         typeof modifier.padding === "number"
//             ? modifier.padding
//             : modifier.padding?.right || 0;
//     const PADDING_BOTTOM =
//         typeof modifier.padding === "number"
//             ? modifier.padding
//             : modifier.padding?.bottom || 0;
//     const PADDING_LEFT =
//         typeof modifier.padding === "number"
//             ? modifier.padding
//             : modifier.padding?.left || 0;

//     let x = currentX + PADDING_LEFT;
//     let y = currentY + PADDING_TOP;
//     let contentWidth = 0;
//     let contentHeight = 0;

//     if (typeof element.type === "function") {
//         // FunctionComponent
//         if (instance.renderedChildInstance) {
//             // FCs pass their currentX, currentY to children, padding is handled by children or the FC's returned primitive
//             const childSize = drawUI(
//                 ctx,
//                 instance.renderedChildInstance,
//                 currentX,
//                 currentY,
//             );
//             instance.x = currentX; // FC instance itself takes the coordinates it was given
//             instance.y = currentY;
//             instance.width = childSize.width; // FC's size is effectively its child's size
//             instance.height = childSize.height;
//             return childSize;
//         }
//         instance.x = currentX;
//         instance.y = currentY;
//         instance.width = 0;
//         instance.height = 0;
//         return { width: 0, height: 0 };
//     }

//     // Host Components
//     ctx.font = "16px Arial"; // Default font
//     ctx.textBaseline = "top"; // Easier for y-coordinate calcs

//     let totalPaddingX = PADDING_LEFT + PADDING_RIGHT;
//     let totalPaddingY = PADDING_TOP + PADDING_BOTTOM;

//     // Pre-calculate size based on content and modifier, then draw background, then content
//     switch (element.type) {
//         case "uiText":
//             const textMetrics = ctx.measureText(props.text);
//             contentWidth = textMetrics.width;
//             contentHeight = 16; // Approximate height for 16px font
//             break;

//         case "uiButton":
//             const btnTextMetrics = ctx.measureText(props.text);
//             const btnInternalPadding = 5; // Internal padding for button text
//             contentWidth = btnTextMetrics.width + 2 * btnInternalPadding;
//             contentHeight = 16 + 2 * btnInternalPadding;
//             break;

//         case "uiColumn":
//         case "uiBox":
//             let accumulatedHeight = 0;
//             let maxChildW = 0;
//             instance.renderedChildrenInstances.forEach((child) => {
//                 if (child) {
//                     // Temporarily draw children to get their size for parent calculation
//                     // This is inefficient; a proper measure pass is needed.
//                     // For now, assume children are drawn at (0,0) relative to content area for measurement.
//                     const childSize = drawUI(
//                         ctx,
//                         child,
//                         x,
//                         y + accumulatedHeight,
//                     ); // Draw relative to padded parent
//                     accumulatedHeight += childSize.height;
//                     // Account for child's own bottom padding for stacking (simplified)
//                     const childModifier = child.element.props.modifier || {};
//                     accumulatedHeight +=
//                         typeof childModifier.padding === "number"
//                             ? childModifier.padding
//                             : childModifier.padding?.bottom || 0;
//                     maxChildW = Math.max(maxChildW, childSize.width);
//                 }
//             });
//             contentWidth = maxChildW;
//             contentHeight =
//                 accumulatedHeight -
//                 (instance.renderedChildrenInstances.length > 0
//                     ? PADDING_BOTTOM
//                     : 0); // Approximate
//             break;
//         default: // Unknown type
//             contentWidth = 0;
//             contentHeight = 0;
//             break;
//     }

//     instance.width =
//         modifier.width !== undefined
//             ? modifier.width
//             : contentWidth + totalPaddingX;
//     instance.height =
//         modifier.height !== undefined
//             ? modifier.height
//             : contentHeight + totalPaddingY;

//     // Store actual draw coordinates
//     instance.x = currentX;
//     instance.y = currentY;

//     // Draw background for the host component itself (covers its full width/height including its padding)
//     if (modifier.background) {
//         ctx.fillStyle = modifier.background;
//         ctx.fillRect(instance.x, instance.y, instance.width, instance.height);
//     }

//     // Draw actual content
//     ctx.fillStyle = (props as any).color || "#000"; // Default text/content color

//     switch (element.type) {
//         case "uiText":
//             ctx.fillText(props.text, x, y);
//             break;
//         case "uiButton":
//             const btnInternalPadding = 5;
//             ctx.fillText(
//                 props.text,
//                 x + btnInternalPadding,
//                 y + btnInternalPadding,
//             );
//             break;
//         case "uiColumn":
//         case "uiBox":
//             // Children were already "drawn" to calculate size, now redraw them in their final positions
//             // This is inefficient. A separate measure/layout pass is better.
//             let currentChildY = y;
//             instance.renderedChildrenInstances.forEach((child) => {
//                 if (child) {
//                     const childSize = drawUI(ctx, child, x, currentChildY);
//                     currentChildY += childSize.height;
//                     const childModifier = child.element.props.modifier || {};
//                     currentChildY +=
//                         typeof childModifier.padding === "number"
//                             ? childModifier.padding
//                             : childModifier.padding?.bottom || 0;
//                 }
//             });
//             break;
//     }

//     return { width: instance.width, height: instance.height };
// }

// // --- Main Render Loop & Setup ---
// function renderLoop() {
//     if (!_canvasCtx || !_appRootComponent) return;
//     _isUpdateScheduled = false;

//     // Clear effects to run from previous frame (they should have run)
//     _effectsToRun = [];

//     // Reconcile tree
//     const rootElement = { type: _appRootComponent, props: {} }; // Assuming root takes no props for now
//     _rootInstance = reconcile(null, _rootInstance, rootElement);

//     // Clear canvas and draw
//     _canvasCtx.clearRect(
//         0,
//         0,
//         _canvasCtx.canvas.width,
//         _canvasCtx.canvas.height,
//     );
//     if (_rootInstance) {
//         drawUI(_canvasCtx, _rootInstance, 0, 0);
//     }

//     // Run effects
//     const currentEffects = [..._effectsToRun]; // Copy effects to run
//     _effectsToRun = []; // Clear for next cycle

//     currentEffects.forEach(({ hook }) => {
//         // Ensure effects don't accidentally use component's hook context
//         const previousRenderingInstanceForEffect = _currentRenderingInstance;
//         const previousHookIndexForEffect = _currentHookIndex;
//         _currentRenderingInstance = null;
//         _currentHookIndex = 0;

//         hook.cleanup = hook.callback() || undefined;
//         hook.hasRun = true; // Mark that this effect has run at least once

//         _currentRenderingInstance = previousRenderingInstanceForEffect;
//         _currentHookIndex = previousHookIndexForEffect;
//     });
// }

// function scheduleRender() {
//     if (!_isUpdateScheduled) {
//         _isUpdateScheduled = true;
//         requestAnimationFrame(renderLoop);
//     }
// }

// function hitTest(
//     instance: ComponentInstance | null,
//     clickX: number,
//     clickY: number,
// ): ComponentInstance | null {
//     if (!instance) return null;

//     // Check children first (topmost rendered last, so reverse order for hit test)
//     if (typeof instance.element.type !== "function") {
//         // Host components have renderedChildrenInstances
//         for (
//             let i = instance.renderedChildrenInstances.length - 1;
//             i >= 0;
//             i--
//         ) {
//             const hit = hitTest(
//                 instance.renderedChildrenInstances[i],
//                 clickX,
//                 clickY,
//             );
//             if (hit) return hit;
//         }
//     } else if (instance.renderedChildInstance) {
//         // Function components have one renderedChildInstance
//         const hit = hitTest(instance.renderedChildInstance, clickX, clickY);
//         if (hit) return hit;
//     }

//     // Check current instance if it's clickable and point is within its bounds
//     if (
//         instance.onClick &&
//         clickX >= instance.x &&
//         clickX <= instance.x + instance.width &&
//         clickY >= instance.y &&
//         clickY <= instance.y + instance.height
//     ) {
//         return instance;
//     }
//     return null;
// }

// export function initUI(
//     canvas: HTMLCanvasElement,
//     rootComponent: FunctionComponent<any>,
// ) {
//     _canvasCtx = canvas.getContext("2d");
//     if (!_canvasCtx) throw new Error("Failed to get 2D context");
//     _appRootComponent = rootComponent;

//     canvas.addEventListener("click", (e) => {
//         if (!_canvasCtx) return;
//         const rect = canvas.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;

//         const clickedInstance = hitTest(_rootInstance, x, y);
//         if (clickedInstance && clickedInstance.onClick) {
//             clickedInstance.onClick();
//             // State changes in onClick should have called scheduleRender()
//         }
//     });

//     scheduleRender(); // Initial render
// }

// // --- Primitive UI Components ---
// export const uiText = (props: {
//     text: string;
//     key?: Key;
//     modifier?: UIModifier;
//     color?: string;
// }): UIElement => ({ type: "uiText", props, key: props.key });

// export const uiButton = (props: {
//     text: string;
//     onClick: () => void;
//     key?: Key;
//     modifier?: UIModifier;
//     color?: string;
// }): UIElement => ({ type: "uiButton", props, key: props.key });

// export const uiColumn = (props: {
//     children: Array<UIElement | null | undefined | false>;
//     key?: Key;
//     modifier?: UIModifier;
// }): UIElement => ({
//     type: "uiColumn",
//     props: {
//         ...props,
//         children: (props.children?.filter(Boolean) as UIElement[]) || [],
//     },
//     key: props.key,
// });

// export const uiBox = (props: {
//     children: Array<UIElement | null | undefined | false>;
//     key?: Key;
//     modifier?: UIModifier;
// }): UIElement => ({
//     type: "uiBox",
//     props: {
//         ...props,
//         children: (props.children?.filter(Boolean) as UIElement[]) || [],
//     },
//     key: props.key,
// });

// // --- Example Usage (can be in a separate file) ---

// // --- CounterBox Component ---
// const CounterBox = (props: {
//     initialCount: number;
//     modifier?: UIModifier;
//     key?: Key;
// }) => {
//     const [count, setCount] = useState(props.initialCount);

//     useEffect(() => {
//         console.log(
//             `CounterBox [${props.key}] mounted/updated. Initial count:`,
//             props.initialCount,
//             "Current count:",
//             count,
//         );
//         return () => {
//             console.log(
//                 `CounterBox [${props.key}] unmounted. Final count was:`,
//                 count,
//             );
//         };
//     }, [props.initialCount]); // Effect depends on initialCount prop

//     const heavyValue = remember(() => {
//         console.log(`CounterBox [${props.key}] calculating heavy value.`);
//         return `Heavy Calc: ${Math.random().toFixed(3)}`;
//     }, []);

//     return uiBox({
//         modifier: uiModifier(
//             uiPadding(10),
//             uiBackground("#E0F0E0"), // Light green background for CounterBox
//             props.modifier || {},
//         ),
//         key: props.key, // Pass key for the box itself if needed, though usually on the component call
//         children: [
//             uiText({
//                 text: `Counter: ${count}`,
//                 modifier: uiPadding({ bottom: 10 }),
//                 color: "#333",
//             }),
//             uiText({
//                 text: `Prop: ${props.initialCount}`,
//                 modifier: uiPadding({ bottom: 10 }),
//                 color: "#555",
//             }),
//             uiText({
//                 text: heavyValue,
//                 modifier: uiPadding({ bottom: 10 }),
//                 color: "#777",
//             }),
//             uiButton({
//                 text: "Increment",
//                 onClick: () => setCount((c) => c + 1),
//                 modifier: uiModifier(uiBackground("#AFA"), uiPadding(5)),
//             }),
//         ],
//     });
// };

// // --- Main App Component ---
// const App = () => {
//     const [showCounter, setShowCounter] = useState(true);
//     const [boxKey, setBoxKey] = useState("counterBox1");
//     const [counterStartValue, setCounterStartValue] = useState(5);

//     useEffect(() => {
//         console.log("App mounted");
//         return () => {
//             console.log("App unmounted");
//         };
//     }, []);

//     const appTitle = remember(() => "My Declarative Canvas UI", []);

//     return uiColumn({
//         modifier: uiModifier(uiPadding(20), uiBackground("#F0F0F8")), // Light lavender background for App
//         children: [
//             uiText({
//                 text: appTitle,
//                 modifier: uiModifier(
//                     uiPadding({ bottom: 15 }),
//                     uiBackground("#D0D0E0"),
//                 ),
//                 color: "#111",
//             }),
//             uiButton({
//                 text: showCounter ? "Hide Counter Box" : "Show Counter Box",
//                 onClick: () => setShowCounter((s) => !s),
//                 modifier: uiModifier(
//                     uiPadding({ bottom: 10 }),
//                     uiBackground("#DDF"),
//                 ),
//             }),
//             uiButton({
//                 text: "Change Box Key (remounts)",
//                 onClick: () => {
//                     setBoxKey((k) =>
//                         k === "counterBox1" ? "counterBox2" : "counterBox1",
//                     );
//                     // Also change the initial count when key changes to make it more obvious
//                     setCounterStartValue((v) => (v === 5 ? 55 : 5));
//                 },
//                 modifier: uiModifier(
//                     uiPadding({ bottom: 10 }),
//                     uiBackground("#FDD"),
//                 ),
//             }),
//             showCounter &&
//                 CounterBox({
//                     key: boxKey,
//                     initialCount: counterStartValue,
//                     modifier: uiModifier(uiPadding(5), uiBackground("#CFC")), // Greenish background for the instance
//                 }),
//             !showCounter &&
//                 uiText({
//                     text: "Counter is hidden.",
//                     modifier: uiPadding(10),
//                     color: "#888",
//                 }),
//         ],
//     });
// };

// // --- Initial Setup ---
// // Ensure this runs after the DOM is fully loaded
// document.addEventListener(
//     "DOMContentLoaded",
//     () => {
//         console.log("DOM Loaded");
//         const canvasElement: HTMLCanvasElement | null = document.getElementById(
//             "gameCanvas",
//         ) as HTMLCanvasElement; // Use getElementById for clarity

//         if (canvasElement == null) {
//             console.error("Canvas element with ID 'gameCanvas' not found");
//             return; // Exit if canvas not found
//         }

//         // Set canvas size - consider device pixel ratio for sharpness
//         canvasElement.width = window.innerWidth;
//         canvasElement.height = window.innerHeight;

//         initUI(canvasElement, App);
//     },
//     false,
// );
