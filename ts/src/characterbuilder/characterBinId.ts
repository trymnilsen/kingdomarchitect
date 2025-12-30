import { hashToString } from "../common/hash.ts";
import type { CharacterColors } from "./colors.ts";

export function getCharacterBinId(characterColors: CharacterColors) {
    const hash = hashToString(characterColors);
    return hash;
}
