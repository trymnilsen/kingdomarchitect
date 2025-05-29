import { createUiComponent } from "./component.js";
import { uiButton } from "./uiButton.js";
import { uiColumn } from "./uiColumn.js";
import { uiText } from "./uiText.js";
/*
const CounterBox = createUiComponent<{ initialCount?: number }>(
    ({ props, useState, useEffect }) => {
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
        console.count("UICounterBox");
        return uiColumn({
            children: [
                uiText({ text: `Count: ${count}` }),
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
); // Add display name

export const App = createUiComponent(({ useEffect, useState }) => {
    const [counterIsVisible, setCounterIsVisible] = useState(true);

    useEffect(() => {
        console.log(`App Effect: counterIsVisible is now ${counterIsVisible}`);
    }, [counterIsVisible]);

    return uiColumn({
        children: [
            uiText({ text: "Welcome to the Declarative UI Demo!" }),
            // Conditionally render CounterBox using standard JS logic
            counterIsVisible ? CounterBox({ initialCount: 5 }) : null,
            uiButton({
                label: counterIsVisible
                    ? "Hide Main Counter"
                    : "Show Main Counter",
                onClick: () => setCounterIsVisible(!counterIsVisible),
            }),
            uiText({ text: "End of App." }),
        ],
    });
});
*/
