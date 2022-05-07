export class NotInitializedError extends Error {
    constructor(field: string) {
        super(`${field} is not initialized`);
    }
}
