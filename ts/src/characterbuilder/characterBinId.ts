import { hashToString } from "../common/hash.js";
import type { CharacterColors } from "./colors.js";

export function getCharacterBinId(characterColors: CharacterColors) {
    const hash = hashToString(characterColors);
    return hash;
}
