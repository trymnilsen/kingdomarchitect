import type { EntityAction } from "./entityAction.js";

export type ActionDispatcher = (action: EntityAction) => void;
