import { Sprite2 } from "../../asset/sprite.ts";

export const SkillCategory = {
    Melee: 0,
    Ranged: 1,
    Magic: 2,
    Productivity: 3,
} as const;

export type SkillCategory = (typeof SkillCategory)[keyof typeof SkillCategory];

export type Skill = {
    asset: Sprite2;
    name: string;
};

export type SkillTree = Skill[][];
