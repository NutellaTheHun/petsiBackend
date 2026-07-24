import { Injectable } from '@nestjs/common';
import { EntitySchemaDto, FieldSchemaDto, ReportSchemaDto } from '../dto/report-schema.dto';
import { FIELD_REGISTRY } from '../registries';

@Injectable()
export class ReportSchemaService {
    getSchema(): ReportSchemaDto {
        const entities: Record<string, EntitySchemaDto> = {};

        for (const [entityKey, entityEntry] of Object.entries(FIELD_REGISTRY)) {
            const fields: Record<string, FieldSchemaDto> = {};

            for (const [fieldKey, fieldEntry] of Object.entries(entityEntry.fields)) {
                const fieldSchema: FieldSchemaDto = {
                    label: fieldEntry.label,
                    dataType: fieldEntry.dataType,
                    filterable: fieldEntry.filterable,
                    aggregatable: fieldEntry.aggregatable,
                    groupable: fieldEntry.groupable,
                };
                if (fieldEntry.options !== undefined) {
                    fieldSchema.options = fieldEntry.options;
                }
                if (fieldEntry.aggregateFns !== undefined) {
                    fieldSchema.aggregateFns = fieldEntry.aggregateFns;
                }
                fields[fieldKey] = fieldSchema;
            }

            entities[entityKey] = { label: entityEntry.label, fields };
        }

        return { entities };
    }
}
