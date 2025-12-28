export interface SerializedEntity {
    id: string;
    parentId: string | null;
    x: number;
    y: number;
    components: Record<string, any>;
}
