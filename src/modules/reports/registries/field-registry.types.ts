import { AggregateFunction } from '../entities/report-definition.entity';

export type DataType = 'string' | 'number' | 'date' | 'time' | 'enum' | 'boolean';

export interface FieldJoin {
    relation: string;
    alias: string;
}

export interface FieldRegistryEntry {
    label: string;
    dataType: DataType;
    options?: string[];
    filterable: boolean;
    aggregatable: boolean;
    aggregateFns?: AggregateFunction[];
    groupable: boolean;
    joins?: FieldJoin[];
    select: string;
    alias: string;
    isChildrenExpansion?: boolean;
}

export interface EntityRegistryEntry {
    label: string;
    fields: Record<string, FieldRegistryEntry>;
}

export type FieldRegistry = Record<string, EntityRegistryEntry>;
