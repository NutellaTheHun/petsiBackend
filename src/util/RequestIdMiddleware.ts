import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { RequestContextService } from "../modules/request-context/RequestContextService";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    constructor(private readonly requestContext: RequestContextService) { }

    use(req: Request, res: Response, next: NextFunction): void {
        const requestId = req.headers['x-request-id'] || randomUUID();
        req['requestId'] = requestId;

        this.requestContext.run(() => {
            // ensure context is cleaned up
            res.on('finish', () => { this.clearRequestContext(); });
            res.on('close', () => { this.clearRequestContext(); });

            try {
                next();
            } catch (error) {
                this.clearRequestContext()
                throw error;
            }
        }, { requestId });
    }

    private clearRequestContext() {
        this.requestContext.run(() => { }, {});
    }
}