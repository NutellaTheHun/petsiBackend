import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
    JsonReportParam,
    JsonReportSection,
    ReportVisibility,
} from '../entities/report-definition.entity';

export class CreateReportDefinitionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsIn(['management', 'staff'])
    visibility: ReportVisibility;

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
