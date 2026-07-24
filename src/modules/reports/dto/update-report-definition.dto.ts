import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import {
    JsonReportParam,
    JsonReportSection,
    ReportVisibility,
} from '../entities/report-definition.entity';

export class UpdateReportDefinitionDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsIn(['management', 'staff'])
    @IsOptional()
    visibility?: ReportVisibility;

    @IsBoolean()
    @IsOptional()
    showHeader?: boolean;

    @IsArray()
    @IsOptional()
    params?: JsonReportParam[];

    @IsArray()
    @IsOptional()
    sections?: JsonReportSection[];
}
