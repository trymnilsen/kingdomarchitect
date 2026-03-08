export type StatType = "might" | "wit" | "presence" | "valor";

export type ResolvedStats = Record<StatType, number>;

export type StatModifiers = Partial<
    Record<StatType, { flat?: number; percent?: number }>
>;

export type StatContributor = {
    label: string;
    stat: StatType;
    flat?: number;
    percent?: number;
};

export const statTypes: StatType[] = ["might", "wit", "presence", "valor"];
