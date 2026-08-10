import { hashToString } from "../../common/hash.ts";
import type { CharacterColors } from "../../rendering/character/characterColors.ts";

export function getCharacterBinId(characterColors: CharacterColors) {
    const hash = hashToString(characterColors);
    return hash;
}
