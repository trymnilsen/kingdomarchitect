/**
 * A callback that can be enabled/disabled.
 * When disabled, calls to invoke() are no-ops.
 */
export class ToggleableCallback<TArgs extends unknown[]> {
    private enabled: boolean;
    private callback: (...args: TArgs) => void;

    constructor(callback: (...args: TArgs) => void, enabled: boolean = true) {
        this.callback = callback;
        this.enabled = enabled;
    }

    invoke(...args: TArgs): void {
        if (this.enabled) {
            this.callback(...args);
        }
    }

    enable(): void {
        this.enabled = true;
    }

    disable(): void {
        this.enabled = false;
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}
