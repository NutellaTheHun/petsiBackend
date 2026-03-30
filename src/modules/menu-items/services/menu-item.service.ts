import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    EntityManager,
    MoreThanOrEqual,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
} from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { OrderContainerItem } from '../../orders/entities/order-container-item.entity';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { REVISION_ENTITY_TYPES } from '../../revision-history/constants/revision-entity-type';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import {
    buildCreatedChangeLog,
    buildRevertedChangeLog,
    buildUpdatedChangeLog,
} from '../../revision-history/utils/change-log-builder';
import { getRevisionActor } from '../../revision-history/utils/revision-actor.util';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MenuItemContainerItemComposer } from '../utils/composers/menu-item-container-item.composer';
import { MenuItemChangeDetector } from '../utils/change-detectors/menu-item.change-detector';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import {
    isMenuItemSnapshotV1,
    menuItemToSnapshotV1,
    MenuItemSnapshotV1,
} from '../utils/snapshots/menu-item-snapshot.v1';
import { MenuItemValidator } from '../validators/menu-item.validator';

@Injectable()
export class MenuItemService extends ServiceBase<MenuItemEntity> {
    constructor(
        @InjectRepository(MenuItem)
        repo: Repository<MenuItem>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: MenuItemValidator,

        @InjectRepository(OrderMenuItem)
        private readonly orderMenuItemRepo: Repository<OrderMenuItem>,
        @InjectRepository(OrderContainerItem)
        private readonly orderContainerItemRepo: Repository<OrderContainerItem>,
        private readonly containerItemComposer: MenuItemContainerItemComposer,
        private readonly menuItemChangeDetector: MenuItemChangeDetector,
        private readonly revisionHistoryService: RevisionHistoryService,
    ) {
        super(repo, 'MenuItemService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateMenuItemDto,
        manager: EntityManager,
    ): Promise<MenuItem> {
        const category =
            dto.categoryId != null
                ? await manager.findOne(MenuItemCategory, {
                      where: { id: dto.categoryId },
                  })
                : null;

        const entity = manager.create(MenuItem, {
            type: dto.type,
            category: category
                ? manager.create(MenuItemCategory, { id: dto.categoryId! })
                : null,
            name: dto.name,
            sizes: dto.sizeIds.map((id) => manager.create(MenuItemSize, { id })),
            variableMaxAmount: dto.variableMaxAmount ?? null,
        });

        const savedResult = await manager.save(entity);

        if (dto.containerMenuItems && dto.containerMenuItems?.length) {
            savedResult.containerMenuItems =
                await this.containerItemComposer.composeManyNestedEntity(
                    dto.containerMenuItems,
                    manager,
                    [],
                    {
                        parentMenuItemId: savedResult.id,
                    },
                );
        }

        return await manager.save(savedResult);
    }

    protected async updateEntity(
        dto: UpdateMenuItemDto,
        manager: EntityManager,
        entity: MenuItem,
    ): Promise<void> {
        if (dto.categoryId !== undefined) {
            if (dto.categoryId === null) {
                entity.category = null;
            } else {
                const exists = await manager.findOne(MenuItemCategory, {
                    where: { id: dto.categoryId },
                });
                entity.category = exists
                    ? manager.create(MenuItemCategory, { id: dto.categoryId })
                    : null;
            }
        }

        if (dto.name !== undefined) {
            entity.name = dto.name;
        }

        if (dto.type !== undefined) {
            entity.type = dto.type;

            if (dto.type === MENU_ITEM_TYPES.SINGLE) {
                entity.containerMenuItems = [];
                entity.variableMaxAmount = null;
                await this.syncOrderMenuItems(entity.id);
            }
        }

        if (dto.variableMaxAmount !== undefined) {
            entity.variableMaxAmount = dto.variableMaxAmount;
        }

        if (dto.sizeIds !== undefined) {
            entity.sizes = dto.sizeIds.map((id) =>
                manager.create(MenuItemSize, { id }),
            );
        }

        if (dto.containerMenuItems !== undefined) {
            const previous = [...(entity.containerMenuItems ?? [])];
            const newItems = await this.containerItemComposer.composeManyNestedEntity(
                dto.containerMenuItems ?? [],
                manager,
                previous,
                {
                    parentMenuItemId: entity.id,
                },
            );
            const newIds = new Set(newItems.map((x) => x.id));
            for (const old of previous) {
                if (!newIds.has(old.id)) {
                    await manager.remove(old);
                }
            }
            entity.containerMenuItems = newItems;
        }

        await manager.save(entity);
    }

    private async syncOrderMenuItems(id: number) {
        const activeOrderItems = await this.orderMenuItemRepo.find({
            where: {
                menuItem: { id },
                parentOrder: {
                    isFrozen: false,
                    fulfillmentDate: MoreThanOrEqual(new Date()),
                },
            },
            relations: ['order', 'containerOrderMenuItems'],
        });

        for (const orderItem of activeOrderItems) {
            await this.orderContainerItemRepo.delete({
                parentOrderMenuItem: { id: orderItem.id },
            });
        }
    }

    protected async afterCreateInTransaction(
        manager: EntityManager,
        entity: MenuItem,
    ): Promise<void> {
        const full = await manager.findOne(MenuItem, {
            where: { id: entity.id },
            relations: this.getSnapshotRelations(),
        });
        if (!full) {
            return;
        }
        const changeLog = buildCreatedChangeLog(
            getRevisionActor(this.requestContextService),
        );
        const payload = menuItemToSnapshotV1(full);
        await this.revisionHistoryService.appendRevision(manager, {
            entityType: REVISION_ENTITY_TYPES.MENU_ITEM,
            entityId: full.id,
            changeLog: changeLog as unknown as Record<string, unknown>,
            payload: payload as unknown as Record<string, unknown>,
        });
    }

    protected async afterUpdateInTransaction(
        manager: EntityManager,
        entity: MenuItem,
        ctx: {
            detectionResult?: ChangeDetectionResult<UpdateMenuItemDto>;
        },
    ): Promise<void> {
        if (!ctx.detectionResult?.hasChanges) {
            return;
        }
        const full = await manager.findOne(MenuItem, {
            where: { id: entity.id },
            relations: this.getSnapshotRelations(),
        });
        if (!full) {
            return;
        }
        const changeLog = buildUpdatedChangeLog(
            ctx.detectionResult.changes,
            getRevisionActor(this.requestContextService),
        );
        const payload = menuItemToSnapshotV1(full);
        await this.revisionHistoryService.appendRevision(manager, {
            entityType: REVISION_ENTITY_TYPES.MENU_ITEM,
            entityId: full.id,
            changeLog: changeLog as unknown as Record<string, unknown>,
            payload: payload as unknown as Record<string, unknown>,
        });
    }

    private getSnapshotRelations(): string[] {
        return this.getUpdateDiffRelations();
    }

    async applyMenuItemSnapshotV1(
        manager: EntityManager,
        entity: MenuItem,
        snap: MenuItemSnapshotV1,
    ): Promise<void> {
        entity.name = snap.name;
        entity.type = snap.type as MenuItem['type'];

        if (snap.categoryId != null) {
            const exists = await manager.findOne(MenuItemCategory, {
                where: { id: snap.categoryId },
            });
            entity.category = exists
                ? manager.create(MenuItemCategory, { id: snap.categoryId })
                : null;
        } else {
            entity.category = null;
        }

        entity.sizes = snap.sizeIds.map((id) =>
            manager.create(MenuItemSize, { id }),
        );
        entity.variableMaxAmount = snap.variableMaxAmount;

        const existing = await manager.find(MenuItemContainerItem, {
            where: { parentMenuItem: { id: entity.id } },
        });
        for (const row of existing) {
            await manager.remove(row);
        }

        for (const line of snap.containerItems) {
            const row = manager.create(MenuItemContainerItem, {
                parentMenuItem: entity,
                parentItemSize: manager.create(MenuItemSize, {
                    id: line.parentItemSizeId,
                }),
                containedMenuItem: manager.create(MenuItem, {
                    id: line.containedMenuItemId,
                }),
                containedItemSize: manager.create(MenuItemSize, {
                    id: line.containedItemSizeId,
                }),
                quantity: line.quantity,
            });
            await manager.save(row);
        }

        await manager.save(entity);
    }

    async revertToRevision(
        menuItemId: number,
        targetRevisionNumber: number,
    ): Promise<MenuItem> {
        const row = await this.revisionHistoryService.getRevisionRow(
            REVISION_ENTITY_TYPES.MENU_ITEM,
            menuItemId,
            targetRevisionNumber,
        );
        if (!row) {
            throw new NotFoundException(
                `Revision ${targetRevisionNumber} not found for menu item ${menuItemId}`,
            );
        }
        const payload = row.payload;
        if (!isMenuItemSnapshotV1(payload)) {
            throw new BadRequestException(
                'Unsupported or invalid menu item snapshot payload',
            );
        }

        await this.entityRepo.manager.transaction(async (manager) => {
            const entity = await manager.findOne(MenuItem, {
                where: { id: menuItemId },
                relations: [
                    'category',
                    'sizes',
                    'containerMenuItems',
                    'containerMenuItems.containedItemSize',
                    'containerMenuItems.containedMenuItem',
                    'containerMenuItems.parentItemSize',
                ],
            });
            if (!entity) {
                throw new NotFoundException();
            }
            await this.applyMenuItemSnapshotV1(manager, entity, payload);
            const changeLog = buildRevertedChangeLog(
                targetRevisionNumber,
                getRevisionActor(this.requestContextService),
            );
            const full = await manager.findOne(MenuItem, {
                where: { id: menuItemId },
                relations: this.getSnapshotRelations(),
            });
            if (!full) {
                throw new NotFoundException();
            }
            await this.revisionHistoryService.appendRevision(manager, {
                entityType: REVISION_ENTITY_TYPES.MENU_ITEM,
                entityId: menuItemId,
                changeLog: changeLog as unknown as Record<string, unknown>,
                payload: menuItemToSnapshotV1(full) as unknown as Record<
                    string,
                    unknown
                >,
            });
        });

        const result = await this.entityRepo.findOne({
            where: { id: menuItemId },
            relations: this.getSnapshotRelations(),
        });
        if (!result) {
            throw new NotFoundException();
        }
        return result;
    }

    protected applySearch(
        query: SelectQueryBuilder<MenuItem>,
        search: string,
    ): void {
        query.andWhere('(LOWER(entity.name) LIKE :search)', {
            search: `%${search.toLowerCase()}%`,
        });
    }

    protected applyFilters(
        query: SelectQueryBuilder<MenuItem>,
        filters: Record<string, string[]>,
    ): void {
        if (filters.category && filters.category.length > 0) {
            query.andWhere('entity.category IN (:...categories)', {
                categories: filters.category,
            });
        }
        if (filters.type && filters.type.length > 0) {
            query.andWhere('entity.type IN (:...types)', {
                types: filters.type,
            });
        }
    }

    protected applySortBy(
        query: SelectQueryBuilder<MenuItem>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'name') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
        if (sortBy === 'category') {
            query.leftJoinAndSelect('entity.category', 'menuItemCategory');
            query.orderBy(`menuItemCategory.name`, sortOrder, 'NULLS LAST');
        }
    }

    protected getChangeDetector(): ChangeDetectorBase<MenuItem, UpdateMenuItemDto> | undefined {
        return this.menuItemChangeDetector;
    }

    protected getUpdateDiffRelations(): string[] {
        return [
            'category',
            'sizes',
            'containerMenuItems',
            'containerMenuItems.containedMenuItem',
            'containerMenuItems.containedItemSize',
            'containerMenuItems.parentItemSize',
        ];
    }
}
