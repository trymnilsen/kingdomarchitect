export type ImmortalComponent = {
    id: typeof ImmortalComponentId;
};

export const ImmortalComponentId = "immortal";

export function createImmortalComponent(): ImmortalComponent {
    return { id: ImmortalComponentId };
}
