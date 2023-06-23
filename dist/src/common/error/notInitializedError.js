export class NotInitializedError extends Error {
    constructor(field){
        super(`${field} is not initialized`);
    }
}
