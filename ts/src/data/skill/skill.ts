import { Sprite2 } from "../../asset/sprite";

export enum SkillCategory {
    Melee,
    Ranged,
    Magic,
    Productivity,
}

export interface Skill {
    asset: Sprite2;
    name: string;
    category: SkillCategory;
}

export type SkillTree = Skill[][];
