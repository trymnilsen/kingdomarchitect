import { Request, Response, NextFunction } from "express";
import { getLog } from "../monitoring/logger";

const logger = getLog("Request");
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    next();
    logger.info(`${req.method} ${req.path} ${req.connection.remoteAddress}`);
}
