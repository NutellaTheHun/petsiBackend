import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemService } from '../services/menu-item.service';

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
  ) {
    super(repo, 'MenuItem', requestContextService, logger);
  }

  public async validateCreate(
    createId: string,
    dto: CreateMenuItemDto,
  ): Promise<void> {
    // exists
    if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
      this.addError(
        this.buildValidationError(
          'itemName',
          'Menu item already exists.',
          'EXIST',
          undefined,
          createId,
        ),
      );
    }

    // Cannot assign both containerOptions and a definedContainer
    if (
      dto.containerOptionDto &&
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos.length > 0
    ) {
      this.addError(
        this.buildValidationError(
          'containerOptions',
          'Cannot assign a container item as both a defined and dynamic.',
          'INVALID',
          undefined,
          createId,
        ),
      );
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
          this.addError(
            this.buildValidationError(
              'definedContainerItems',
              'Invalid size assigned for container size of the contained item.',
              'INVALID',
              undefined,
              createId,
            ),
          );
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
          this.addError(
            this.buildValidationError(
              'definedContainerItems',
              'Dupliate item in defined container.',
              'DUPLICATE',
              undefined,
              createId,
            ),
          );
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
          this.addError(
            this.buildValidationError(
              'validSizes',
              'Duplicate sizes for menu item.',
              'DUPLICATE',
              undefined,
              id.toString(),
            ),
          );
        }
      }
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateMenuItemDto,
  ): Promise<void> {
    // Cannot change name to another existing item
    if (dto.itemName) {
      if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
        this.addError(
          this.buildValidationError(
            'itemName',
            'Menu item already exists.',
            'EXIST',
            id,
          ),
        );
      }
    }

    // Cannot assign both containerOptions and a definedContainer
    if (
      dto.containerOptionDto &&
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos.length > 0
    ) {
      //return `Cannot create MenuItem with both containerOptions and definedContainerItems`;
      this.addError(
        this.buildValidationError(
          'containerOptions',
          'Cannot assign a container item as both a defined and dynamic.',
          'INVALID',
          id,
        ),
      );
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
          this.addError(
            this.buildValidationError(
              'definedContainerItems',
              'Cannot assign a container item to be defined while it is dynamic.',
              'INVALID',
              id,
            ),
          );
        }
      }

      // If updating container options while item has definedContainer
      if (
        dto.containerOptionDto &&
        currentItem.definedContainerItems &&
        currentItem.definedContainerItems?.length > 0
      ) {
        if (dto.definedContainerItemDtos !== null) {
          this.addError(
            this.buildValidationError(
              'containerOptions',
              'Cannot assign a container item to be dynamic while it is defined.',
              'INVALID',
              id,
            ),
          );
        }
      }
    }

    if (
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos?.length > 0
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
          this.addError(
            this.buildValidationError(
              'definedContainerItems',
              'Dupliate item in defined container.',
              'DUPLICATE',
              duplicate.containedMenuItemId,
            ),
          );
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
          this.addError(
            this.buildValidationError(
              'definedContainerItems',
              'Duplicate sizes for menu item',
              'DUPLICATE',
              dupId,
            ),
          );
        }
      }
    }

    this.throwIfErrors();
  }
}
