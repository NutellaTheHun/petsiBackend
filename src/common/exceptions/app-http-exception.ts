import { HttpException, HttpStatus } from "@nestjs/common";

// fit ValidationError, Service Error/DataBase error in here, builderError?
export class AppHttpException extends HttpException {
    constructor(
        message: string,
        status: HttpStatus,
        public readonly code?: string,
        public readonly details?: any,
    ) {
        super({ message, code, details }, status);
    }
}