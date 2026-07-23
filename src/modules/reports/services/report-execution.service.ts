import { ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppHttpException } from '../../../common/exceptions/app-http-exception';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { ColumnDefDto, ReportResultDto, ReportSectionResultDto } from '../dto/report-result.dto';
import {
    JsonTableReportSection,
    JsonTextReportSection,
    ReportDefinition,
} from '../entities/report-definition.entity';
import { FIELD_REGISTRY } from '../registries';
import { FieldRegistryEntry } from '../registries/field-registry.types';

const ENTITY_QUERY_CONFIG: Record<string, { entityClass: any; alias: string }> = {
    orders: { entityClass: Order, alias: 'order' },
    orderMenuItems: { entityClass: OrderMenuItem, alias: 'orderMenuItem' },
};

@Injectable()
export class ReportExecutionService {
    constructor(
        @InjectRepository(ReportDefinition)
        private readonly definitionRepo: Repository<ReportDefinition>,
        private readonly dataSource: DataSource,
        private readonly requestContextService: RequestContextService,
    ) {}

    async execute(definitionId: number, runtimeParams: Record<string, any>): Promise<ReportResultDto> {
        const definition = await this.definitionRepo.findOne({ where: { id: definitionId } });
        if (!definition) {
            throw new NotFoundException(`ReportDefinition #${definitionId} not found`);
        }

        const roles = this.requestContextService.get<string[]>('roles') ?? [];
        const canSeeMgmt = roles.includes(ROLE_MANAGER) || roles.includes(ROLE_ADMIN);
        if (definition.visibility === 'management' && !canSeeMgmt) {
            throw new ForbiddenException('Access denied to management report');
        }

        const sortedSections = [...definition.sections].sort((a, b) => a.order - b.order);
        const sections: ReportSectionResultDto[] = [];

        for (const section of sortedSections) {
            if (section.type === 'text') {
                sections.push(this.processTextSection(section));
            } else if (section.type === 'table') {
                sections.push(await this.processTableSection(section, runtimeParams));
            }
        }

        return {
            reportId: definition.id,
            name: definition.name,
            generatedAt: new Date(),
            params: runtimeParams,
            sections,
        };
    }

    protected processTextSection(section: JsonTextReportSection): ReportSectionResultDto {
        return { type: 'text', title: section.title, content: section.content };
    }

    protected async processTableSection(
        section: JsonTableReportSection,
        runtimeParams: Record<string, any>,
    ): Promise<ReportSectionResultDto> {
        const entityConfig = ENTITY_QUERY_CONFIG[section.entity];
        if (!entityConfig) {
            throw new AppHttpException(`Unknown entity: ${section.entity}`, HttpStatus.BAD_REQUEST);
        }

        const entityRegistry = FIELD_REGISTRY[section.entity];

        const columnEntries: Array<{ fieldEntry: FieldRegistryEntry; label: string }> = [];
        for (const col of section.columns) {
            const fieldEntry = entityRegistry.fields[col.fieldKey];
            if (!fieldEntry) {
                throw new AppHttpException(
                    `Unknown field key: ${col.fieldKey}`,
                    HttpStatus.BAD_REQUEST,
                );
            }
            if (fieldEntry.select) {
                columnEntries.push({ fieldEntry, label: col.label ?? fieldEntry.label });
            }
        }

        if (columnEntries.length === 0) {
            return { type: 'table', title: section.title, columns: [], rows: [] };
        }

        const qb = this.dataSource.createQueryBuilder(entityConfig.entityClass, entityConfig.alias);
        const addedJoinAliases = new Set<string>();

        const applyJoins = (fieldEntry: FieldRegistryEntry) => {
            for (const join of fieldEntry.joins ?? []) {
                if (!addedJoinAliases.has(join.alias)) {
                    qb.leftJoin(join.relation, join.alias);
                    addedJoinAliases.add(join.alias);
                }
            }
        };

        qb.select(columnEntries[0].fieldEntry.select, columnEntries[0].fieldEntry.alias);
        applyJoins(columnEntries[0].fieldEntry);
        for (let i = 1; i < columnEntries.length; i++) {
            qb.addSelect(columnEntries[i].fieldEntry.select, columnEntries[i].fieldEntry.alias);
            applyJoins(columnEntries[i].fieldEntry);
        }

        if (section.entity === 'orders') {
            qb.andWhere(`${entityConfig.alias}.isFrozen = :isFrozen`, { isFrozen: false });
        }

        for (let i = 0; i < (section.filters ?? []).length; i++) {
            const filter = section.filters[i];
            const filterFieldEntry = entityRegistry.fields[filter.field];
            if (!filterFieldEntry) {
                throw new AppHttpException(
                    `Unknown filter field: ${filter.field}`,
                    HttpStatus.BAD_REQUEST,
                );
            }
            applyJoins(filterFieldEntry);

            const value =
                filter.source === 'param' ? runtimeParams[filter.paramName] : filter.value;
            const paramKey = `fp_${i}`;
            qb.andWhere(`${filterFieldEntry.select} ${filter.operator} :${paramKey}`, {
                [paramKey]: value,
            });
        }

        const rows = await qb.getRawMany();

        const columns: ColumnDefDto[] = columnEntries.map(({ fieldEntry, label }) => ({
            key: fieldEntry.alias,
            label,
            dataType: fieldEntry.dataType,
        }));

        return { type: 'table', title: section.title, columns, rows };
    }
}
