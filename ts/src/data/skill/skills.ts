import { SkillTree } from "./skill.ts";
import { meleeSkills } from "./melee.ts";
import { magicSkills } from "./magic.ts";
import { productivitySkills } from "./productivity.ts";
import { rangedSkills } from "./ranged.ts";

type SkillsObject = {
    magic: SkillTree;
    melee: SkillTree;
    productivity: SkillTree;
    ranged: SkillTree;
};

export const skills: SkillsObject = {
    magic: magicSkills,
    melee: meleeSkills,
    productivity: productivitySkills,
    ranged: rangedSkills,
};
