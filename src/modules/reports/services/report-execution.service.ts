import { ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AppHttpException } from '../../../common/exceptions/app-http-exception';
import { OrderContainerItem } from '../../orders/entities/order-container-item.entity';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { ColumnDefDto, ReportResultDto, ReportSectionResultDto } from '../dto/report-result.dto';
import {
    JsonMetricReportSection,
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
        @InjectRepository(OrderMenuItem)
        private readonly orderMenuItemRepo: Repository<OrderMenuItem>,
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
            } else if (section.type === 'metric') {
                sections.push(await this.processMetricSection(section, runtimeParams));
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

        const hasChildrenExpansion = section.columns.some(
            (col) => entityRegistry.fields[col.fieldKey]?.isChildrenExpansion === true,
        );

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

        if (hasChildrenExpansion) {
            qb.addSelect(`${entityConfig.alias}.id`, '__parentId');
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

        if (section.groupBy && section.groupBy.length > 0) {
            for (const fieldKey of section.groupBy) {
                const fieldEntry = entityRegistry.fields[fieldKey];
                if (!fieldEntry) {
                    throw new AppHttpException(
                        `Unknown groupBy field key: ${fieldKey}`,
                        HttpStatus.BAD_REQUEST,
                    );
                }
                applyJoins(fieldEntry);
                qb.addGroupBy(fieldEntry.select);
            }
        }

        const hasAggregates = !!(section.aggregates && section.aggregates.length > 0);
        if (hasAggregates) {
            for (let i = 0; i < section.aggregates!.length; i++) {
                const agg = section.aggregates![i];
                const fieldEntry = entityRegistry.fields[agg.fieldKey];
                if (!fieldEntry) {
                    throw new AppHttpException(
                        `Unknown aggregate field key: ${agg.fieldKey}`,
                        HttpStatus.BAD_REQUEST,
                    );
                }
                applyJoins(fieldEntry);
                qb.addSelect(`${agg.fn.toUpperCase()}(${fieldEntry.select})`, `__agg_${i}`);
            }
        }

        const rows = await qb.getRawMany();

        const mappedRows = hasAggregates
            ? rows.map((row) => {
                  const mapped: Record<string, any> = { ...row };
                  section.aggregates!.forEach((agg, i) => {
                      mapped[agg.label] = Number(row[`__agg_${i}`]);
                      delete mapped[`__agg_${i}`];
                  });
                  return mapped;
              })
            : rows;

        if (hasChildrenExpansion) {
            const parentIds = [...new Set(mappedRows.map((r) => r.__parentId))].filter(
                (id): id is number => id != null,
            );
            const childrenByParentId = new Map<number, OrderContainerItem[]>();
            if (parentIds.length > 0) {
                const parentEntities = await this.orderMenuItemRepo.find({
                    where: { id: In(parentIds) },
                });
                for (const parent of parentEntities) {
                    childrenByParentId.set(parent.id, parent.containerOrderMenuItems ?? []);
                }
            }
            for (const row of mappedRows) {
                const containers = childrenByParentId.get(row.__parentId) ?? [];
                row.children = containers.map((ci) => ({
                    itemName: ci.containedMenuItem?.name ?? null,
                    sizeName: ci.containedItemSize?.name ?? null,
                    quantity: ci.quantity,
                }));
                delete row.__parentId;
            }
        }

        const columns: ColumnDefDto[] = columnEntries.map(({ fieldEntry, label }) => ({
            key: fieldEntry.alias,
            label,
            dataType: fieldEntry.dataType,
        }));

        if (hasAggregates) {
            for (const agg of section.aggregates!) {
                columns.push({ key: agg.label, label: agg.label, dataType: 'number' });
            }
        }

        return { type: 'table', title: section.title, columns, rows: mappedRows };
    }

    protected async processMetricSection(
        section: JsonMetricReportSection,
        runtimeParams: Record<string, any>,
    ): Promise<ReportSectionResultDto> {
        const entityConfig = ENTITY_QUERY_CONFIG[section.entity];
        if (!entityConfig) {
            throw new AppHttpException(`Unknown entity: ${section.entity}`, HttpStatus.BAD_REQUEST);
        }

        if (!section.aggregates || section.aggregates.length === 0) {
            return { type: 'metric', title: section.title, metrics: [] };
        }

        const entityRegistry = FIELD_REGISTRY[section.entity];
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

        const firstAgg = section.aggregates[0];
        const firstFieldEntry = entityRegistry.fields[firstAgg.fieldKey];
        if (!firstFieldEntry) {
            throw new AppHttpException(
                `Unknown aggregate field key: ${firstAgg.fieldKey}`,
                HttpStatus.BAD_REQUEST,
            );
        }
        applyJoins(firstFieldEntry);
        qb.select(`${firstAgg.fn.toUpperCase()}(${firstFieldEntry.select})`, `__agg_0`);

        for (let i = 1; i < section.aggregates.length; i++) {
            const agg = section.aggregates[i];
            const fieldEntry = entityRegistry.fields[agg.fieldKey];
            if (!fieldEntry) {
                throw new AppHttpException(
                    `Unknown aggregate field key: ${agg.fieldKey}`,
                    HttpStatus.BAD_REQUEST,
                );
            }
            applyJoins(fieldEntry);
            qb.addSelect(`${agg.fn.toUpperCase()}(${fieldEntry.select})`, `__agg_${i}`);
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

        const [row] = await qb.getRawMany();

        const metrics = section.aggregates.map((agg, i) => ({
            label: agg.label,
            value: row ? Number(row[`__agg_${i}`]) : 0,
        }));

        return { type: 'metric', title: section.title, metrics };
    }
}
