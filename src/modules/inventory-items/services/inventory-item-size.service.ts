import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import {
    InventoryItemSize,
    InventoryItemSizeEntity,
} from '../entities/inventory-item-size.entity';
import { InventoryItemSizeComposer } from '../utils/composers/inventory-item-size.composer';
import { InventoryItemSizeChangeDetector } from '../utils/change-detectors/inventory-item-size.change-detector';
import { InventoryItemSizeValidator } from '../validators/inventory-item-size.validator';

@Injectable()
export class InventoryItemSizeService extends ServiceBase<InventoryItemSizeEntity> {
    constructor(
        @InjectRepository(InventoryItemSize)
        repo: Repository<InventoryItemSize>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        @Inject(forwardRef(() => InventoryItemSizeValidator))
        validator: InventoryItemSizeValidator,

        private readonly itemSizeComposer: InventoryItemSizeComposer,
        private readonly itemSizeChangeDetector: InventoryItemSizeChangeDetector,
    ) {
        super(
            repo,
            'InventoryItemSizeService',
            requestContextService,
            logger,
            validator,
        );
    }

    protected async createEntity(
        dto: CreateInventoryItemSizeDto,
        manager: EntityManager,
    ): Promise<InventoryItemSize> {
        return await manager.save(
            await this.itemSizeComposer.composeCreate(dto, manager),
        );
    }

    protected async updateEntity(
        dto: UpdateInventoryItemSizeDto,
        manager: EntityManager,
        entity: InventoryItemSize,
    ): Promise<void> {
        await this.itemSizeComposer.composeUpdate(dto, manager, entity)
        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<InventoryItemSize>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'cost') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }

    protected getChangeDetector():
        | ChangeDetectorBase<InventoryItemSize, UpdateInventoryItemSizeDto>
        | undefined {
        return this.itemSizeChangeDetector as unknown as ChangeDetectorBase<
            InventoryItemSize,
            UpdateInventoryItemSizeDto
        >;
    }
}
