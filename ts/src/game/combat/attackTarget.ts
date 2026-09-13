import type { Point } from "../../common/point.ts";
import { AttackTargetKind } from "../../data/combat/attackProfileDefinition.ts";

export type AttackTarget =
    | { kind: typeof AttackTargetKind.Entity; id: string }
    | { kind: typeof AttackTargetKind.Tile; point: Point };
