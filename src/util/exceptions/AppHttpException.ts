import { HttpException, HttpStatus } from "@nestjs/common";

export class AppHttpException extends HttpException {
    constructor(
        message: string,
        status: HttpStatus,
        public readonly code?: string,
        public readonly details?: any,
    ){
        super({ message, code, details }, status);
    }
}