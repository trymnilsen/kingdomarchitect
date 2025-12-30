import type { DiscoverTileEffect } from "./discoverTileEffect.ts";
import type { SetSceneEffect } from "./setSceneEffect.ts";
import type { ReloadGameEffect } from "./reloadGameEffect.ts";

export type GameEffect = DiscoverTileEffect | SetSceneEffect | ReloadGameEffect;
