import { randomEntry } from "../../../common/array.js";
import { biomes, BiomeType } from "../biome/biome.js";

export function randomBiomeType(): BiomeType {
    const types = Object.entries(biomes)
        .filter(([_, value]) => value.generate)
        .map(([key]) => key) as BiomeType[];

    return randomEntry(types);
}
