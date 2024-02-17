import { TilesetGenerator } from "../../tile/tilesetGenerator.js";
import { StatelessComponent } from "../entityComponent.js";

export class TileUnlockComponent extends StatelessComponent {
    private generator = new TilesetGenerator();

    unlockPattern(point: Point[]) {}
}
