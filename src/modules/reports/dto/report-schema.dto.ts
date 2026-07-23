import { AggregateFunction } from '../entities/report-definition.entity';
import { DataType } from '../registries/field-registry.types';

export class FieldSchemaDto {
    label: string;
    dataType: DataType;
    options?: string[];
    filterable: boolean;
    aggregatable: boolean;
    aggregateFns?: AggregateFunction[];
    groupable: boolean;
}

export class EntitySchemaDto {
    label: string;
    fields: Record<string, FieldSchemaDto>;
}

export class ReportSchemaDto {
    entities: Record<string, EntitySchemaDto>;
}
