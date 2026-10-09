import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../modules/request-context/request-context.module';
import { GlobalHttpExceptionFilter } from './global-http-exception-filter';

@Module({
    imports: [RequestContextModule],
    providers: [GlobalHttpExceptionFilter],
    exports: [GlobalHttpExceptionFilter],
})
export class ExceptionsModule {}
