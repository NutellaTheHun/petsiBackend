import { Injectable } from "@nestjs/common";
import { AppLogger } from "../../modules/app-logging/app-logger";
import { DatabaseError } from "./database-error";
import { DatabaseException } from "./database-exception";

@Injectable()
export class DataBaseExceptionHandler {
    constructor(
        private logger: AppLogger,
    ) { }

    public handle(err: unknown, servicePrefix: string, requestId: string, action: string): DatabaseException {
        const exception = DatabaseError.fromTypeOrmError(err);
        this.logger.logError(
            servicePrefix,
            requestId,
            action,
            exception
        );
        return exception;
    }
}