import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter{
    catch(exception: any, host: ArgumentsHost){
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception instanceof HttpException
            ? exception.getResponse()
            : { message: exception.message || 'internal server error' };

        const errorBody = 
            typeof exceptionResponse === 'string'
            ? { message: exceptionResponse }
            : exceptionResponse;
        
        const customResponse = {
            statusCode: status,
            timeStamp: new Date().toISOString(),
            path: request.url,
            ...errorBody,
        };

        response.status(status).json(customResponse);
    }
}