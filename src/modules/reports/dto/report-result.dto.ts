import { DataType } from '../registries/field-registry.types';

export interface ColumnDefDto {
    key: string;
    label: string;
    dataType: DataType;
}

export interface TableSectionResultDto {
    type: 'table';
    title: string;
    columns: ColumnDefDto[];
    rows: Record<string, unknown>[];
}

export interface MetricValueDto {
    label: string;
    value: unknown;
}

export interface MetricSectionResultDto {
    type: 'metric';
    title: string;
    metrics: MetricValueDto[];
}

export interface TextSectionResultDto {
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
