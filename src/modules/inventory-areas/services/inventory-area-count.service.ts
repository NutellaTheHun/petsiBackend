import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import {
    InventoryAreaCount,
    InventoryAreaCountEntity,
} from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryAreaItemComposer } from '../utils/composers/inventory-area-item.composer';
import { InventoryAreaCountChangeDetector } from '../utils/change-detectors/inventory-area-count.change-detector';
import { InventoryAreaCountValidator } from '../validators/inventory-area-count.validator';

@Injectable()
export class InventoryAreaCountService extends ServiceBase<InventoryAreaCountEntity> {
    constructor(
        @InjectRepository(InventoryAreaCount)
        repo: Repository<InventoryAreaCount>,
        logger: AppLogger,
        requestContextService: RequestContextService,
        @Inject(forwardRef(() => InventoryAreaCountValidator))
        validator: InventoryAreaCountValidator,

        private readonly areaItemResolver: InventoryAreaItemComposer,
        private readonly areaCountChangeDetector: InventoryAreaCountChangeDetector,
    ) {
        super(
            repo,
            'InventoryAreaCountService',
            requestContextService,
            logger,
            validator,
        );
    }

    protected async createEntity(
        dto: CreateInventoryAreaCountDto,
        manager: EntityManager,
    ): Promise<InventoryAreaCount> {
        const entity = manager.create(InventoryAreaCount, {
            inventoryArea: { id: dto.inventoryAreaId },
        });

        const savedEntity = await manager.save(entity);

        if (dto.countedInventoryItems?.length) {
            savedEntity.countedInventoryItems =
                await this.areaItemResolver.composeManyNestedEntity(
                    dto.countedInventoryItems,
                    manager,
                    [],
                    { parentInventoryCountId: savedEntity.id },
                );
            await manager.save(savedEntity);
        }

        return savedEntity;
    }

    protected async updateEntity(
        dto: UpdateInventoryAreaCountDto,
        manager: EntityManager,
        entity: InventoryAreaCount,
    ): Promise<void> {
        if (dto.inventoryAreaId !== undefined) {
            entity.inventoryArea = manager.create(InventoryArea, {
                id: dto.inventoryAreaId,
            });
        }

        if (dto.countedInventoryItems !== undefined) {
            const existingItems = entity.countedInventoryItems ?? [];
            const incomingIds = dto.countedInventoryItems
                .map((i: any) => ('id' in i ? i.id : undefined))
                .filter((id: any): id is number => typeof id === 'number');

            const idsToRemove = existingItems
                .map((i) => i.id)
                .filter((id) => !incomingIds.includes(id));

            if (idsToRemove.length) {
                await manager.delete(InventoryAreaItem, { id: In(idsToRemove) });
                entity.countedInventoryItems = existingItems.filter(
                    (i) => !idsToRemove.includes(i.id),
                );
            }

            entity.countedInventoryItems =
                await this.areaItemResolver.composeManyNestedEntity(
                    dto.countedInventoryItems,
                    manager,
                    entity.countedInventoryItems ?? [],
                    { parentInventoryCountId: entity.id },
                );
        }

        await manager.save(entity);
    }

    protected applySearch(
        query: SelectQueryBuilder<InventoryAreaCount>,
        search: string,
    ): void {
        query.distinct(true);

        query
            .leftJoin('entity.countedInventoryItems', 'areaItem')
            .leftJoin('areaItem.countedInventoryItem', 'inventoryItem')
            .andWhere('(LOWER(inventoryItem.name) LIKE :search)', {
                search: `%${search.toLowerCase()}%`,
            });
    }

    /**
     * Filters by inventoryArea id.
     * @param query The query builder to filter.
     * @param filters The filters to apply. <propertyName(entity), id>
     */
    protected applyFilters(
        query: SelectQueryBuilder<InventoryAreaCount>,
        filters: Record<string, string[]>,
    ): void {
        if (filters.inventoryArea && filters.inventoryArea.length > 0) {
            query.andWhere('entity.inventoryArea IN (:...inventoryAreas)', {
                inventoryAreas: filters.inventoryArea,
            });
        }
    }

    protected applyDate(
        query: SelectQueryBuilder<InventoryAreaCount>,
        startDate: string,
        endDate?: string,
        dateBy?: string,
    ): void {
        query.andWhere(`DATE(entity.countDate) >= :startDate`, { startDate });

        if (endDate) {
            query.andWhere(`DATE(entity.countDate) <= :endDate`, { endDate });
        }
    }

    protected applySortBy(
        query: SelectQueryBuilder<InventoryAreaCount>,
        sortBy: string,
        sortOrder?: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'countDate') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        } else if (sortBy === 'inventoryArea') {
            query.leftJoinAndSelect('entity.inventoryArea', 'area');
            query.orderBy(`area.name`, sortOrder);
        }
    }

    protected getChangeDetector():
        | ChangeDetectorBase<InventoryAreaCount, UpdateInventoryAreaCountDto>
        | undefined {
        return this.areaCountChangeDetector;
    }

    protected getUpdateDiffRelations(): string[] {
        return [
            'inventoryArea',
            'countedInventoryItems',
            'countedInventoryItems.countedInventoryItem',
            'countedInventoryItems.countedItemSize',
        ];
    }
}
