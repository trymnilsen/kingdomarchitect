// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConstructorFunction<T> = new (...args: any[]) => T;

export function getConstructorName(object: object): string {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    const name = Object.getPrototypeOf(object).constructor.name;
    if (typeof name == "string") {
        return name;
    } else {
        throw new Error("object does not have constructor");
    }
}
