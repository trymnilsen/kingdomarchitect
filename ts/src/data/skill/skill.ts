import type { SpriteRef } from "../../asset/sprite.ts";

export type Skill = {
    asset: SpriteRef;
    name: string;
};

export type SkillTree = Skill[][];
