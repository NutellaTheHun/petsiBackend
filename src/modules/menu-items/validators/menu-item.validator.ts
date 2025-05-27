import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateMenuItemDto } from "../dto/menu-item/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/menu-item/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemContainerItemService } from "../services/menu-item-container-item.service";
import { MenuItemService } from "../services/menu-item.service";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItem> {
    constructor(
        @InjectRepository(MenuItem)
        private readonly repo: Repository<MenuItem>,

        @Inject(forwardRef(() => MenuItemContainerItemService))
        private readonly containerService: MenuItemContainerItemService,

        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'MenuItem', requestContextService, logger); }

    public async validateCreate(dto: CreateMenuItemDto): Promise<void> {

        // exists
        if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
            this.addError({
                errorMessage: 'Menu item already exists.',
                errorType: 'EXIST',
                contextEntity: 'CreateMenuItemDto',
                sourceEntity: 'MenuItem',
                value: dto.itemName,
            } as ValidationError);
        }

        // Cannot assign both containerOptions and a definedContainer 
        if (dto.containerOptionDto && dto.definedContainerItemDtos && dto.definedContainerItemDtos.length > 0) {
            this.addError({
                errorMessage: 'Cannot assign a container item as both a defined and dynamic.',
                errorType: 'INVALID',
                contextEntity: 'CreateMenuItemDto',
                sourceEntity: 'MenuItemContainerOptionsDto',
                conflictEntity: 'MenuItemContainerItemDto',
            } as ValidationError);
        }


        if (dto.definedContainerItemDtos && dto.definedContainerItemDtos.length > 0) {

            // validate parentSize / definedContainedItem parentSize
            for (const item of dto.definedContainerItemDtos) {
                if (!this.helper.isValidSize(item.parentContainerSizeId, dto.validSizeIds)) {
                    this.addError({
                        errorMessage: 'Invalid size assigned for container size of the contained item.',
                        errorType: 'INVALID',
                        contextEntity: 'CreateMenuItemDto',
                        sourceEntity: 'MenuItemSize',
                        sourceId: item.parentContainerSizeId,
                        conflictEntity: 'MenuItem',
                    } as ValidationError);
                }
            }

            // no parentSize / item / size duplicate
            const duplicateItems = this.helper.findDuplicates(
                dto.definedContainerItemDtos,
                (item) => `${item.parentContainerSizeId}:${item.containedMenuItemId}:${item.containedMenuItemSizeId}`
            );
            if (duplicateItems) {
                for (const duplicate of duplicateItems) {
                    this.addError({
                        errorMessage: 'Dupliate item in defined container.',
                        errorType: 'DUPLICATE',
                        contextEntity: 'CreateMenuItemDto',
                        sourceEntity: 'MenuItemContainerItemDto',
                        value: {
                            parentContainerSizeId: duplicate.parentContainerSizeId,
                            containedMenuItemId: duplicate.containedMenuItemId,
                            containedMenuItemSizeId: duplicate.containedMenuItemSizeId,
                        }
                    } as ValidationError);
                }
            }
        }

        // No duplicate validSizes
        if (dto.validSizeIds && dto.validSizeIds.length > 0) {
            const duplicateSizesIds = this.helper.findDuplicates(
                dto.validSizeIds,
                (sizeId) => `${sizeId}`
            );
            if (duplicateSizesIds) {
                for (const id of duplicateSizesIds) {
                    this.addError({
                        errorMessage: 'Duplicate sizes for menu item',
                        errorType: 'DUPLICATE',
                        contextEntity: 'CreateMenuItemDto',
                        sourceEntity: 'MenuItemSize',
                        value: { menuItemSizeId: id }
                    } as ValidationError);
                }
            }
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateMenuItemDto): Promise<void> {
        // Cannot change name to another existing item
        if (dto.itemName) {
            if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
                this.addError({
                    errorMessage: 'Menu item already exists.',
                    errorType: 'EXIST',
                    contextEntity: 'UpdateMenuItemDto',
                    contextId: id,
                    sourceEntity: 'MenuItem',
                    value: dto.itemName,
                } as ValidationError);
            }
        }

        // Cannot assign both containerOptions and a definedContainer
        if (dto.containerOptionDto && dto.definedContainerItemDtos && dto.definedContainerItemDtos.length > 0) {
            //return `Cannot create MenuItem with both containerOptions and definedContainerItems`;
            this.addError({
                errorMessage: 'Cannot assign a container item as both a defined and dynamic.',
                errorType: 'INVALID',
                contextEntity: 'UpdateMenuItemDto',
                contextId: id,
                sourceEntity: 'MenuItemContainerOptionsDto',
                conflictEntity: 'MenuItemContainerItemDto',
            } as ValidationError);
        }

        // containerOptions or definedContainer or neither
        if (dto.containerOptionDto || dto.definedContainerItemDtos) {
            const currentItem = await this.repo.findOne({ where: { id }, relations: ['definedContainerItems', 'containerOptions'] });
            if (!currentItem) { throw new Error(); }

            // If updating definedContainer while item has container options
            if (dto.definedContainerItemDtos && dto.definedContainerItemDtos.length > 0 && currentItem?.containerOptions) {
                if (dto.containerOptionDto !== null) {
                    this.addError({
                        errorMessage: 'Cannot assign a container item to be defined while it is dynamic.',
                        errorType: 'INVALID',
                        contextEntity: 'UpdateMenuItemDto',
                        contextId: id,
                        sourceEntity: 'MenuItemContainerItemDto',
                        conflictEntity: 'MenuItemContainerOptions',
                    } as ValidationError);
                }
            }

            // If updating container options while item has definedContainer
            if (dto.containerOptionDto && currentItem.definedContainerItems && currentItem.definedContainerItems?.length > 0) {
                if (dto.definedContainerItemDtos !== null) {
                    this.addError({
                        errorMessage: 'Cannot assign a container item to be dynamic while it is defined.',
                        errorType: 'INVALID',
                        contextEntity: 'UpdateMenuItemDto',
                        contextId: id,
                        sourceEntity: 'MenuItemContainerOptionsDto',
                        conflictEntity: 'MenuItemContainerItem',
                    } as ValidationError);
                }
            }
        }

        if (dto.definedContainerItemDtos && dto.definedContainerItemDtos?.length > 0) {

            const duplicateItemDtos: { parentContainerSizeId: number; containedMenuItemId: number; containedMenuItemSizeId: number }[] = [];

            const parentItem = await this.itemService.findOne(id, ['validSizes']);
            if (!parentItem) { throw new Error(); }

            for (const item of dto.definedContainerItemDtos) {
                if (item.mode === 'create') {

                    // validate parent.validSizes and containerItem.parentContainerSize 
                    const validSizes = dto.validSizeIds ?? parentItem.validSizes;

                    if (!this.helper.isValidSize(item.parentContainerSizeId, validSizes)) {
                        this.addError({
                            errorMessage: 'Invalid container size assigned for the contained item.',
                            errorType: 'INVALID',
                            contextEntity: 'UpdateMenuItemDto',
                            contextId: id,
                            sourceEntity: 'MenuItemSize',
                            sourceId: item.parentContainerSizeId,
                            conflictEntity: 'MenuItem',
                        } as ValidationError);
                    }

                    duplicateItemDtos.push({
                        parentContainerSizeId: item.parentContainerSizeId,
                        containedMenuItemId: item.containedMenuItemId,
                        containedMenuItemSizeId: item.containedMenuItemSizeId,
                    });
                }
                else if (item.mode === 'update') {
                    const currentItem = await this.containerService.findOne(item.id, ['containedItem', 'containedItemsize', 'parentContainerSize']);
                    duplicateItemDtos.push({
                        parentContainerSizeId: currentItem.parentContainerSize.id,
                        containedMenuItemId: item.containedMenuItemId ?? currentItem.containedItem.id,
                        containedMenuItemSizeId: item.containedMenuItemSizeId ?? currentItem.containedItemsize.id,
                    });
                }
            }

            // no parentSize / item / size duplicate
            const duplicateItems = this.helper.findDuplicates(
                duplicateItemDtos,
                (item) => `${item.parentContainerSizeId}:${item.containedMenuItemId}:${item.containedMenuItemSizeId}`
            );
            if (duplicateItems) {
                for (const duplicate of duplicateItems) {
                    this.addError({
                        errorMessage: 'Dupliate item in defined container.',
                        errorType: 'DUPLICATE',
                        contextEntity: 'UpdateMenuItemDto',
                        sourceEntity: 'MenuItemContainerItemDto',
                        value: {
                            parentContainerSizeId: duplicate.parentContainerSizeId,
                            containedMenuItemId: duplicate.containedMenuItemId,
                            containedMenuItemSizeId: duplicate.containedMenuItemSizeId,
                        }
                    } as ValidationError);
                }
            }
        }

        if (dto.validSizeIds) {

            // duplicate sizes
            const duplicateSizesIds = this.helper.findDuplicates(
                dto.validSizeIds,
                (sizeId) => `${sizeId}`
            );
            if (duplicateSizesIds) {
                for (const dupId of duplicateSizesIds) {
                    this.addError({
                        errorMessage: 'Duplicate sizes for menu item',
                        errorType: 'DUPLICATE',
                        contextEntity: 'UpdateMenuItemDto',
                        contextId: id,
                        sourceEntity: 'MenuItemSize',
                        sourceId: dupId
                    } as ValidationError);
                }
            }
        }

        this.throwIfErrors()
    }
}