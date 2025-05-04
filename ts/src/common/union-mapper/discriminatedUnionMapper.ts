// Define a base constraint for our discriminated unions
type DiscriminatedUnionObject = { id: string };

// Define the generic shape of a single handler
// U is the overall Union type (e.g., Jobs)
// K is the specific 'id' literal type for this handler (e.g., "pickupItem")
type Handler<
    ContextType,
    U extends DiscriminatedUnionObject,
    K extends U["id"] = U["id"],
> = {
    id: K;
    // The 'run' function is type-safe: it only accepts the member of the union 'U'
    // whose 'id' matches 'K'. We use Extract<U, { id: K }> to achieve this.
    run: (context: ContextType, data: Extract<U, { id: K }>) => void; // Or Promise<void> for async
};

// Type for representing potentially nested handlers during registration
// Allows single handlers, arrays of handlers, or nested arrays.
type HandlerInput<ContextType, U extends DiscriminatedUnionObject> =
    | Handler<ContextType, U, U["id"]>
    | Array<Handler<ContextType, U, U["id"]> | HandlerInput<ContextType, U>>; // Recursive definition for nesting

function createDiscriminatedUnionProcessor<
    ContextType,
    U extends DiscriminatedUnionObject,
>(
    ...handlersToRegister: HandlerInput<ContextType, U>[]
): (context: ContextType, data: U) => boolean {
    // Returns the processor function

    console.log("Setting up discriminated union processor...");
    const setupStart = performance.now();

    // Internal map to store handlers, captured by the returned function's closure.
    const handlersMap = new Map<
        U["id"],
        (context: ContextType, data: U) => void
    >();
    let handlerCount = 0;

    // Recursive function to process and flatten handler definitions
    const processHandlerInput = (
        handlerInput: HandlerInput<ContextType, U>,
    ) => {
        if (Array.isArray(handlerInput)) {
            // Recursively process each element in the array
            handlerInput.forEach(processHandlerInput);
        } else if (
            handlerInput &&
            typeof handlerInput === "object" &&
            "id" in handlerInput &&
            "run" in handlerInput
        ) {
            // It's a single handler object
            const handler = handlerInput as Handler<ContextType, U, U["id"]>; // Assertion ok due to checks
            if (handlersMap.has(handler.id)) {
                console.warn(
                    `Processor Setup Warning: Duplicate handler provided for id "${handler.id}". Overwriting previous handler.`,
                );
            }
            // Store the handler function, ensuring the correct type via closure + registration logic.
            handlersMap.set(
                handler.id,
                handler.run as (context: ContextType, data: U) => void,
            );
            handlerCount++;
        } else {
            console.warn(
                "Processor Setup Warning: Invalid handler input skipped.",
                handlerInput,
            );
        }
    };

    // Process all provided handler definitions
    handlersToRegister.forEach(processHandlerInput);

    const setupDuration = performance.now() - setupStart;
    console.log(
        `Processor setup complete. ${handlerCount} handlers registered in ${setupDuration.toFixed(2)}ms.`,
    );

    // Return the actual processor function
    return (context: ContextType, data: U): boolean => {
        if (!data || typeof data.id !== "string") {
            console.error(
                "Processor Error: Input data is invalid or missing 'id'.",
                data,
            );
            return false;
        }

        // Look up the handler in the captured map
        const handler = handlersMap.get(data.id);

        if (handler) {
            try {
                // Execute the found handler
                handler(context, data);
                return true;
            } catch (error) {
                console.error(
                    `Processor Error: Exception during execution for id "${data.id}":`,
                    error,
                );
                return false;
            }
        } else {
            // console.warn(`Processor Warning: No handler registered for id "${data.id}".`); // Optional: Can be noisy
            return false;
        }
    };
}
