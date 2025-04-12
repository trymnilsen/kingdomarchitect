import type { Entity } from "../../game/entity/entity.js";
import type { EntityAction } from "./entityAction.js";

export type ActionDispatcher = (action: EntityAction) => void;
