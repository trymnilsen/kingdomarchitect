/**
 * Request text input from the player.
 * Currently uses the browser prompt(). This abstraction exists so we can
 * replace it with a canvas-rendered text input in the future without
 * changing call sites.
 */
export function requestTextInput(label: string): string | null {
    return prompt(label);
}
