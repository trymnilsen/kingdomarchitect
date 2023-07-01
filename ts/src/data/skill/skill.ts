import { Sprite2 } from "../../asset/sprite.js";

export enum SkillCategory {
    Melee,
    Ranged,
    Magic,
    Productivity,
}

export interface Skill {
    asset: Sprite2;
    name: string;
}

export type SkillTree = Skill[][];
