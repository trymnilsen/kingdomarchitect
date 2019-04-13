import { JsonNode, JsonNodeType } from "./jsonNode";

export class JsonTree extends JsonNode {
    public constructor() {
        super(null, JsonNodeType.Container);
    }
    public toData() {
        throw new Error("Method not implemented.");
    }
}
