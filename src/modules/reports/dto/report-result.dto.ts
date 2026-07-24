import { DataType } from '../registries/field-registry.types';

export interface ColumnDefDto {
    key: string;
    label: string;
    dataType: DataType;
}

interface TableSectionResultDto {
    type: 'table';
    title: string;
    columns: ColumnDefDto[];
    rows: Record<string, any>[];
}

interface MetricValueDto {
    label: string;
    value: any;
}

interface MetricSectionResultDto {
    type: 'metric';
    title: string;
    metrics: MetricValueDto[];
}

interface TextSectionResultDto {
    type: 'text';
    title: string;
    content: string;
}

export type ReportSectionResultDto =
    | TableSectionResultDto
    | MetricSectionResultDto
    | TextSectionResultDto;

export interface ReportResultDto {
    reportId: number;
    name: string;
    generatedAt: Date;
    params: Record<string, any>;
    sections: ReportSectionResultDto[];
}
