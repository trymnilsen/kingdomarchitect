import { midpointColor } from "../../common/color/hexColor.ts";
import { biomes, biomeTerrainColors, type BiomeType } from "./biome.ts";
import { tileShades } from "./deterministicTileColor.ts";
import { Terrain, type TerrainColors } from "./terrain.ts";

export const TileColorVariation = 20;
export type TerrainShades = {
    dark: string[];
    dim: string[];
    bright: string[];
};

export const biomeTileShades: Record<
    BiomeType,
    Record<Terrain, TerrainShades>
> = Object.fromEntries(
    (Object.keys(biomes) as BiomeType[]).map((biome) => [
        biome,
        Object.fromEntries(
            Object.values(Terrain).map((terrain) => [
                terrain,
                terrainShades(biomeTerrainColors(biome, terrain)),
            ]),
        ),
    ]),
) as Record<BiomeType, Record<Terrain, TerrainShades>>;

export function terrainDimColor(colors: TerrainColors): string {
    return midpointColor(colors.tint, colors.color);
}

function terrainShades(colors: TerrainColors): TerrainShades {
    return {
        dark: tileShades(colors.tint, TileColorVariation),
        dim: tileShades(terrainDimColor(colors), TileColorVariation),
        bright: tileShades(colors.color, TileColorVariation),
    };
}
