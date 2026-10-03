import { Module } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './global-http-exception-filter';

@Module({
    providers: [GlobalHttpExceptionFilter],
    exports: [GlobalHttpExceptionFilter],
})
export class ExceptionsModule {}
