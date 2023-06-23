import { sprites2 } from "../../../asset/sprite.js";
import { Adjacency } from "../../../common/adjacency.js";
export function wallAdjacency(adjacency) {
    switch(adjacency){
        case Adjacency.Left:
            return sprites2.stone_wood_walls_left;
        case Adjacency.Right:
            return sprites2.stone_wood_walls_right;
        case Adjacency.Upper:
            return sprites2.stone_wood_walls_up;
        case Adjacency.Bottom:
            return sprites2.stone_wood_walls_bottom;
        case Adjacency.LeftRight:
            return sprites2.stone_wood_walls_horizontal;
        case Adjacency.LeftRightUpper:
            return sprites2.stone_wood_walls_lur;
        case Adjacency.LeftUpper:
            return sprites2.stone_wood_walls_lu;
        case Adjacency.LeftBottom:
            return sprites2.stone_wood_walls_lb;
        case Adjacency.LeftRightBottom:
            return sprites2.stone_wood_walls_lbr;
        case Adjacency.LeftRightUpperBottom:
            return sprites2.stone_wood_walls_lurb;
        case Adjacency.RightUpper:
            return sprites2.stone_wood_walls_ur;
        case Adjacency.RightUpperBottom:
            return sprites2.stone_wood_walls_ubr;
        case Adjacency.RightBottom:
            return sprites2.stone_wood_walls_br;
        case Adjacency.UpperBottom:
            return sprites2.stone_wood_walls_vertical;
        default:
            return sprites2.stone_wood_walls;
    }
}
