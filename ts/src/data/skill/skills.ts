import { SkillTree } from "./skill";
import { meleeSkills } from "./melee";
import { magicSkills } from "./magic";
import { productivitySkills } from "./productivity";
import { rangedSkills } from "./ranged";

type SkillsObject = {
    melee: SkillTree;
    magic: SkillTree;
    ranged: SkillTree;
    productivity: SkillTree;
};

export const skills: SkillsObject = {
    magic: magicSkills,
    melee: meleeSkills,
    productivity: productivitySkills,
    ranged: rangedSkills,
};
