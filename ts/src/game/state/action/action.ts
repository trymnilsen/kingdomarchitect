export interface Action<T = any> {
    name: String;
    data: T;
}
