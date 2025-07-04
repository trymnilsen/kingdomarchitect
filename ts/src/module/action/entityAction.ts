export type EntityAction = {
    id: [EntityActionCategory, string] | [EntityActionCategory, string, string];
};

export type EntityActionCategory = "world" | "actor" | "resource" | "building";
