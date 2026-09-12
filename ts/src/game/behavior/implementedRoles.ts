import { WorkerRole } from "../component/worker/roleComponent.ts";

/**
 * The roles a behavior actually implements. The UI book says so rather than
 * leaving a player wondering why their spy never spies.
 */
export const implementedRoles: ReadonlySet<WorkerRole> = new Set([
    WorkerRole.Worker,
    WorkerRole.Guard,
    WorkerRole.Hauler,
]);
