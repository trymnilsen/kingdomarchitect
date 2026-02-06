import { type SpriteRef, spriteRefs } from "../../../asset/sprite.ts";
import { Adjacency } from "../../../common/adjacency.ts";

export function wallAdjacency(adjacency: Adjacency): SpriteRef {
    switch (adjacency) {
        case Adjacency.Left:
            return spriteRefs.stone_wood_walls_left;
        case Adjacency.Right:
            return spriteRefs.stone_wood_walls_right;
        case Adjacency.Upper:
            return spriteRefs.stone_wood_walls_up;
        case Adjacency.Bottom:
            return spriteRefs.stone_wood_walls_bottom;
        case Adjacency.LeftRight:
            return spriteRefs.stone_wood_walls_horizontal;
        case Adjacency.LeftRightUpper:
            return spriteRefs.stone_wood_walls_lur;
        case Adjacency.LeftUpper:
            return spriteRefs.stone_wood_walls_lu;
        case Adjacency.LeftUpperBottom:
            return spriteRefs.stone_wood_walls_lub;
        case Adjacency.LeftBottom:
            return spriteRefs.stone_wood_walls_lb;
        case Adjacency.LeftRightBottom:
            return spriteRefs.stone_wood_walls_lbr;
        case Adjacency.LeftRightUpperBottom:
            return spriteRefs.stone_wood_walls_lurb;
        case Adjacency.RightUpper:
            return spriteRefs.stone_wood_walls_ur;
        case Adjacency.RightUpperBottom:
            return spriteRefs.stone_wood_walls_ubr;
        case Adjacency.RightBottom:
            return spriteRefs.stone_wood_walls_br;
        case Adjacency.UpperBottom:
            return spriteRefs.stone_wood_walls_vertical;
        default:
            return spriteRefs.stone_wood_walls;
    }
}
