import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ReportVisibility = 'management' | 'staff';
export type JsonReportParamType = 'date' | 'dateRange';
export type AggregateFunction = 'sum' | 'count' | 'avg' | 'min' | 'max';

export interface JsonReportParam {
    name: string;
    type: JsonReportParamType;
}

export interface TableSectionColumn {
    fieldKey: string;
    label?: string;
}

export interface AggregateDefinition {
    fieldKey: string;
    fn: AggregateFunction;
    label: string;
}

export interface FixedReportFilter {
    source: 'fixed';
    field: string;
    operator: string;
    value: any;
}

export interface ParamReportFilter {
    source: 'param';
    field: string;
    operator: string;
    paramName: string;
}

export type ReportFilter = FixedReportFilter | ParamReportFilter;

interface BaseJsonReportSection {
    order: number;
    title: string;
}

export interface JsonTableReportSection extends BaseJsonReportSection {
    type: 'table';
    entity: string;
    columns: TableSectionColumn[];
    filters: ReportFilter[];
    groupBy?: string[];
    aggregates?: AggregateDefinition[];
}

export interface JsonMetricReportSection extends BaseJsonReportSection {
    type: 'metric';
    entity: string;
    columns: TableSectionColumn[];
    filters: ReportFilter[];
    aggregates: AggregateDefinition[];
}

export interface JsonTextReportSection extends BaseJsonReportSection {
    type: 'text';
    content: string;
}

export type JsonReportSection = JsonTableReportSection | JsonMetricReportSection | JsonTextReportSection;

@Entity('report_definitions')
export class ReportDefinition {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    name: string;

    @Column({ type: 'varchar' })
    visibility: ReportVisibility;

    @Column({ default: true })
    showHeader: boolean;

    @Column({ type: 'jsonb', default: '[]' })
    params: JsonReportParam[];

    @Column({ type: 'jsonb', default: '[]' })
    sections: JsonReportSection[];
}
