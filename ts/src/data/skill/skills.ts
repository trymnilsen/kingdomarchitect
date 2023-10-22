import { SkillTree } from "./skill.js";
import { meleeSkills } from "./melee.js";
import { magicSkills } from "./magic.js";
import { productivitySkills } from "./productivity.js";
import { rangedSkills } from "./ranged.js";

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
