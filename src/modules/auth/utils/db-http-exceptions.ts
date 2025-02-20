import { HttpException, HttpStatus } from "@nestjs/common";
import { QueryFailedError } from "typeorm";


export function queryFailedBadRequest(queryError: QueryFailedError){
    return new HttpException(
                    {
                        status: HttpStatus.BAD_REQUEST,
                        error: queryError.message,
                        details: queryError.message,
                    },
                    HttpStatus.BAD_REQUEST
                );
}

export function unexpectedErrorInteralServerError(message: string){
        return new HttpException(
            {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
}


