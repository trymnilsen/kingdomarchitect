export type ConstructorFunction<T> = new (...args: any[]) => T;

export function getConstructorName(object: object): string {
    const name = Object.getPrototypeOf(object).constructor.name;
    if (typeof name == "string") {
        return name;
    } else {
        throw new Error("object does not have constructor");
    }
}
