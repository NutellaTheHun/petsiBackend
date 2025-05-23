import { Module } from '@nestjs/common';
import { RequestContextService } from './RequestContextService';

@Module({
    providers: [RequestContextService],
    exports: [RequestContextService],
})
export class RequestContextModule { }