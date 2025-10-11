import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemService } from '../services/menu-item.service';

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItemEntity> {
  constructor(
    @InjectRepository(MenuItem)
    private readonly repo: Repository<MenuItem>,

    @Inject(forwardRef(() => MenuItemContainerItemService))
    private readonly containerService: MenuItemContainerItemService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly itemService: MenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // exists
    if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
      const err = new ValidationErrorNode(
        'itemName',
        id,
        'Menu item already exists.',
      );
      results.push(err);
    }

    // Cannot assign both containerOptions and a definedContainer
    if (
      dto.containerOptionDto &&
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos.length > 0
    ) {
      const err = new ValidationErrorNode(
        'containerOptions',
        id,
        'Cannot assign a container item as both a defined and dynamic.',
      );
      results.push(err);
    }

    if (
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos.length > 0
    ) {
      // validate parentSize / definedContainedItem parentSize
      for (const item of dto.definedContainerItemDtos) {
        const nestedCreateDto = item.createDto;
        if (!nestedCreateDto) {
          throw new Error();
        }
        if (
          !this.helper.isValidSize(
            nestedCreateDto.parentContainerSizeId,
            dto.validSizeIds,
          )
        ) {
          const err = new ValidationErrorNode(
            'definedContainerItems',
            id,
            'Invalid size assigned for container size of the contained item.',
          );
          results.push(err);
        }
      }

      const nestedCreates = dto.definedContainerItemDtos
        .map((nested) => nested.createDto)
        .filter((nested) => nested !== undefined);

      // no parentSize / item / size duplicate
      const duplicateItems = this.helper.findDuplicates(
        nestedCreates,
        (item) =>
          `${item.parentContainerSizeId}:${item.containedMenuItemId}:${item.containedMenuItemSizeId}`,
      );
      if (duplicateItems) {
        for (const duplicate of duplicateItems) {
          const err = new ValidationErrorNode(
            'definedContainerItems',
            id, // NEED NESTED ID
            'Dupliate item in defined container.',
          );
          results.push(err);
        }
      }
    }

    // No duplicate validSizes
    if (dto.validSizeIds && dto.validSizeIds.length > 0) {
      const duplicateSizesIds = this.helper.findDuplicates(
        dto.validSizeIds,
        (sizeId) => `${sizeId}`,
      );
      if (duplicateSizesIds) {
        for (const id of duplicateSizesIds) {
          const err = new ValidationErrorNode(
            'validSizes',
            id, // NEED NESTED ID
            'Duplicate sizes for menu item.',
          );
          results.push(err);
        }
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Cannot change name to another existing item
    if (dto.itemName) {
      if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
        const err = new ValidationErrorNode(
          'itemName',
          id,
          'Menu item already exists.',
        );
        results.push(err);
      }
    }

    // Cannot assign both containerOptions and a definedContainer
    if (
      dto.containerOptionDto &&
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos.length > 0
    ) {
      //return `Cannot create MenuItem with both containerOptions and definedContainerItems`;
      const err = new ValidationErrorNode(
        'containerOptions',
        id,
        'Cannot assign a container item as both a defined and dynamic.',
      );
      results.push(err);
    }

    // containerOptions or definedContainer or neither
    if (dto.containerOptionDto || dto.definedContainerItemDtos) {
      const currentItem = await this.repo.findOne({
        where: { id },
        relations: ['definedContainerItems', 'containerOptions'],
      });
      if (!currentItem) {
        throw new Error();
      }

      // If updating definedContainer while item has container options
      if (
        dto.definedContainerItemDtos &&
        dto.definedContainerItemDtos.length > 0 &&
        currentItem?.containerOptions
      ) {
        if (dto.containerOptionDto !== null) {
          const err = new ValidationErrorNode(
            'definedContainerItems',
            id,
            'Cannot assign a container item to be defined while it is dynamic.',
          );
          results.push(err);
        }
      }

      // If updating container options while item has definedContainer
      if (
        dto.containerOptionDto &&
        currentItem.definedContainerItems &&
        currentItem.definedContainerItems?.length > 0
      ) {
        if (dto.definedContainerItemDtos !== null) {
          const err = new ValidationErrorNode(
            'containerOptions',
            id,
            'Cannot assign a container item to be dynamic while it is defined.',
          );
          results.push(err);
        }
      }
    }

    if (
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos?.length > 0 &&
      id
    ) {
      const resolvedItemDtos: {
        parentContainerSizeId: number;
        containedMenuItemId: number;
        containedMenuItemSizeId: number;
      }[] = [];

      const parentItem = await this.itemService.findOne(id, ['validSizes']);
      if (!parentItem) {
        throw new Error();
      }

      for (const nested of dto.definedContainerItemDtos) {
        if (nested.createDto) {
          resolvedItemDtos.push({
            parentContainerSizeId: nested.createDto.parentContainerSizeId,
            containedMenuItemId: nested.createDto.containedMenuItemId,
            containedMenuItemSizeId: nested.createDto.containedMenuItemSizeId,
          });
        } else if (nested.updateDto && nested.id) {
          const currentItem = await this.containerService.findOne(nested.id, [
            'containedItem',
            'containedItemSize',
            'parentContainerSize',
          ]);
          resolvedItemDtos.push({
            parentContainerSizeId: currentItem.parentContainerSize.id,
            containedMenuItemId:
              nested.updateDto.containedMenuItemId ??
              currentItem.containedItem.id,
            containedMenuItemSizeId:
              nested.updateDto.containedMenuItemSizeId ??
              currentItem.containedItemSize.id,
          });
        } else {
          throw new Error();
        }
      }

      // no parentSize / item / size duplicate
      const duplicateItems = this.helper.findDuplicates(
        resolvedItemDtos,
        (item) =>
          `${item.parentContainerSizeId}:${item.containedMenuItemId}:${item.containedMenuItemSizeId}`,
      );
      if (duplicateItems) {
        for (const duplicate of duplicateItems) {
          const err = new ValidationErrorNode(
            'definedContainerItems',
            id, // NESTED ID
            'Dupliate item in defined container.',
          );
          results.push(err);
        }
      }
    }

    if (dto.validSizeIds) {
      // duplicate sizes
      const duplicateSizesIds = this.helper.findDuplicates(
        dto.validSizeIds,
        (sizeId) => `${sizeId}`,
      );
      if (duplicateSizesIds) {
        for (const dupId of duplicateSizesIds) {
          const err = new ValidationErrorNode(
            'definedContainerItems',
            id, // NESTED ID
            'Duplicate sizes for menu item',
          );
          results.push(err);
        }
      }
    }

    return this.checkValidateResult(results);
  }
}
