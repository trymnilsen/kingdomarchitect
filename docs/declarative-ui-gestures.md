# Declarative UI Gesture System

This document explains how to use the new gesture system in the declarative UI framework.

## Overview

The gesture system allows components to handle user interactions (taps, etc.) in a declarative way using the `withGesture` hook. This replaces the old imperative `dispatchUIEvent` system used with UIView.

## How It Works

1. **Components register gesture handlers** using multiple `withGesture` hooks during rendering (one per event type)
2. **The UiRenderer collects these handlers** and associates them with their layout regions
3. **When events occur**, the InteractionHandler forwards them directly to the UiRenderer (bypassing InteractionState and StateContext)
4. **The UiRenderer traverses the UI tree** depth-first to find the deepest component that can handle the event
5. **Event handlers are called** on the appropriate component

## Event Flow

The event flow has been simplified to route events directly from the InteractionHandler to the UiRenderer:

```
Touch Input → InteractionHandler → UiRenderer → Component Gesture Handlers
```

The old flow that went through InteractionState and StateContext has been bypassed for declarative UI components:

```
// Old (deprecated): Touch Input → InteractionHandler → InteractionState → StateContext → UiRenderer
// New: Touch Input → InteractionHandler → UiRenderer
```

## Using withGesture

### Basic Usage

```typescript
export const myButton = createComponent<MyButtonProps>(
    ({ props, withGesture }) => {
        // Register a tap handler
        withGesture("tap", (event) => {
            console.log("Button tapped at", event.position);
            props.onTap?.();
            return true; // Event was handled
        });

        // Register a separate tapDown handler if needed
        withGesture("tapDown", (event) => {
            console.log("Button pressed down");
            return true;
        });

        // ... rest of component implementation
    }
);
```

### Available Event Types

- `"tap"`: Complete tap (down + up in same location)
- `"tapDown"`: Initial press/touch
- `"tapUp"`: Release/lift
- `"tapCancel"`: Tap was cancelled (e.g., dragged away)

### Custom Hit Testing

You can provide custom hit test logic:

```typescript
withGesture("tap", (event) => {
    // Handle tap
    return true;
}, (point) => {
    // Only handle taps in certain areas of the component
    // Return true if this point should be considered "inside"
    const isInActiveArea = /* your logic here */;
    return isInActiveArea;
});
```

### Event Object Structure

```typescript
type UIEvent = {
    type: UIEventType;
    position: Point;        // Current pointer position
    startPosition?: Point;  // Where the gesture started (for tap, tapUp)
    timestamp: number;      // When the event occurred
};
```

## Event Handling Flow

1. **User interaction occurs** (e.g., tap on screen)
2. **InteractionHandler receives the event** and dispatches directly to UiRenderer
3. **UiRenderer traverses the component tree** depth-first
4. **For each component with gesture handlers**:
   - Check if event position is within component bounds
   - Call custom hitTest if provided
   - Call appropriate event handler if bounds/hit test pass
5. **First component to return `true`** consumes the event (stops propagation)
6. **If no declarative component handles it**, fall back to old InteractionState system

## Integration with Existing Components

### uiButton
The `uiButton` component already uses the new gesture system:

```typescript
uiButton({
    onTap: () => console.log("Button clicked!"),
    child: uiText({ content: "Click me" }),
    // ... other props
})
```

### Custom Components
For custom interactive components, use `withGesture`:

```typescript
export const customInteractiveComponent = createComponent<Props>(
    ({ props, withGesture, withDraw }) => {
        withGesture("tap", (event) => {
            // Handle interaction
            return true;
        });

        withDraw((scope, region) => {
            // Draw component
        });

        return {
            size: { width: 100, height: 50 },
            children: [],
        };
    }
);
```

## Migration from Old System

### Before (Imperative)
```typescript
// Old UIView system
class MyView extends UIView {
    onTap(screenPoint: Point): boolean {
        // Handle tap
        return true;
    }
}
```

### After (Declarative)
```typescript
// New declarative system
export const myComponent = createComponent<Props>(
    ({ props, withGesture }) => {
        withGesture("tap", (event) => {
            // Handle tap
            return true;
        });
        
        // ... component implementation
    }
);
```

## Best Practices

1. **Return `true` from event handlers** when the event is handled to stop propagation
2. **Return `false`** when the event should continue to parent components
3. **Use custom hit testing** for complex interactive areas
4. **Use multiple `withGesture` calls** for different event types when you need precise control
5. **Keep gesture handlers simple** - delegate complex logic to props callbacks

## Example: Complete Interactive Component

```typescript
type InteractiveCardProps = {
    title: string;
    onTap?: () => void;
    onLongPress?: () => void;
};

export const interactiveCard = createComponent<InteractiveCardProps>(
    ({ props, withGesture, withDraw }) => {
        let tapStartTime = 0;
        
        withGesture("tapDown", (event) => {
            tapStartTime = event.timestamp;
            return true;
        });

        withGesture("tap", (event) => {
            const tapDuration = event.timestamp - tapStartTime;
            if (tapDuration > 500) {
                // Long press
                props.onLongPress?.();
            } else {
                // Regular tap
                props.onTap?.();
            }
            return true;
        }, (point) => {
            // Only handle taps in the center area
            // (Custom hit testing logic)
            return true;
        });

        withDraw((scope, region) => {
            // Draw card background
            scope.drawScreenSpaceRectangle({
                x: region.x,
                y: region.y,
                width: region.width,
                height: region.height,
                fill: "#ffffff",
            });
        });

        return {
            size: { width: 200, height: 100 },
            children: [
                // Add child components like text, images, etc.
            ],
        };
    }
);
```

## Key Improvements

1. **Single-event handlers**: Each `withGesture` call handles exactly one event type
2. **Direct routing**: Events go directly from InteractionHandler to UiRenderer, bypassing InteractionState and StateContext
3. **No legacy support**: Old imperative UI event handling is deprecated and commented out
4. **Cleaner API**: `withGesture(eventType, handler, hitTest?)` is more explicit and requires one call per event type
5. **Better performance**: No unnecessary event conversions or routing through intermediate states
6. **Simplified architecture**: The declarative UI system operates independently from the old imperative system

## Migration Notes

- The old `convertToDeclarativeEvent` system has been removed
- Hover events are not yet supported in the new system
- Components should use multiple `withGesture` calls for different event types
- The InteractionState.dispatchUIEvent method is now deprecated and logs warnings

This gesture system provides a clean, declarative way to handle user interactions while maintaining the composability and type safety of the declarative UI framework.
