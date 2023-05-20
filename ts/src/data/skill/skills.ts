import { SkillTree } from "./skill";
import { meleeSkills } from "./melee";
import { magicSkills } from "./magic";
import { productivitySkills } from "./productivity";
import { rangedSkills } from "./ranged";

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
