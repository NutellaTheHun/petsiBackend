import { IsObject, IsOptional } from 'class-validator';

export class ExecuteReportDto {
    @IsObject()
    @IsOptional()
    params?: Record<string, any>;
}
