import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import {
  OrderMenuItem,
  OrderMenuItemEntity,
} from '../entities/order-menu-item.entity';
import { OrderContainerItemValidator } from './order-container-item.validator';

@Injectable()
export class OrderMenuItemValidator extends ValidatorBase<OrderMenuItemEntity> {
  constructor(
    @InjectRepository(OrderMenuItem)
    private readonly repo: Repository<OrderMenuItem>,
    @InjectRepository(OrderContainerItem)
    private readonly orderContainerItemRepo: Repository<OrderContainerItem>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    private readonly orderContainerItemValidator: OrderContainerItemValidator,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'OrderMenuItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateOrderMenuItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    const menuItem = await this.menuItemRepo.findOne({
      where: { id: dto.menuItemId },
      relations: ['validSizes'],
    });
    if (!menuItem) {
      throw new NotFoundException();
    }

    // validate item / size
    if (!this.helper.isValidSize(dto.sizeId, menuItem.sizes)) {
      const err = new ValidationErrorNode('size', id, 'Invalid item size.');
      results.push(err);
    }

    if (dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity cannot be 0',
      );
      results.push(err);
    }

    if (menuItem.type === MENU_ITEM_TYPES.CONTAINER) {
      const seen = new Set<string>();
      const menuItem = await this.menuItemRepo.findOne({
        where: { id: dto.menuItemId },
        relations: [
          'menuItem.containerItems',
          'menuItem.containerItems.containedItem',
          'menuItem.containerItems.containedItemSize',
        ],
      });
      let sum = 0;
      if (!menuItem) {
        throw new Error();
      }
      if (menuItem.containerMenuItems.length === 0) {
        throw new Error();
      }
      if (dto.containerOrderMenuItems?.length) {
        for (const nestedDto of dto.containerOrderMenuItems) {
          const createDto = nestedDto.createDto;
          if (!createDto) {
            throw new Error();
          }
          // Check no duplicate containedItem/ containedSize combinations
          const key = `${createDto.containedMenuItemId}:${createDto.containedItemSizeId}`;
          if (seen.has(key)) {
            const err = new ValidationErrorNode(
              'containerItems',
              id,
              'duplicate item in container',
            );
            results.push(err);
          } else {
            seen.add(key);
          }
          // validate container quantity based on variableMax
          sum += dto.quantity;

          // validate containerItem is valid to the orderMenuItem
          const isValid = menuItem.containerMenuItems.find(
            (x) =>
              x.containedMenuItem.id === createDto.containedMenuItemId &&
              x.containedItemSize.id === createDto.containedItemSizeId,
          );
          if (!isValid) {
            const err = new ValidationErrorNode(
              'containerItems',
              id,
              'invalid item for container',
            );
            results.push(err);
          }
        }

        // validate container quantity based on variableMax
        if (menuItem.variableMaxAmount) {
          if (sum !== menuItem.variableMaxAmount) {
            const err = new ValidationErrorNode(
              'containerItems',
              id,
              'quantity of items in container must equal total declared size of container',
            );
            results.push(err);
          }
        }

        // Nested validator call
        const nestedDtoErrs =
          await this.orderContainerItemValidator.validateManyNestedNode(
            'orderedContainerItems',
            dto.containerOrderMenuItems,
          );
        if (nestedDtoErrs) {
          results.push(nestedDtoErrs);
        }
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateOrderMenuItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    const currentOrderItem = await this.repo.findOne({
      where: { id },
      relations: ['size', 'menuItem'],
    });
    if (!currentOrderItem) {
      throw new NotFoundException();
    }

    // validate item / size
    if (id && (dto.menuItemId || dto.sizeId)) {
      const sizeId = dto.sizeId ?? currentOrderItem.size.id;
      const itemId = dto.menuItemId ?? currentOrderItem.menuItem.id;

      const menuItem = await this.menuItemRepo.findOne({
        where: { id: itemId },
        relations: ['validSizes'],
      });
      if (!menuItem) {
        throw new Error();
      }

      if (!this.helper.isValidSize(sizeId, menuItem.sizes)) {
        const err = new ValidationErrorNode('size', id, 'Invalid item size.');
        results.push(err);
      }
    }

    if (dto.quantity && dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity cannot be 0',
      );
      results.push(err);
    }

    if (currentOrderItem.menuItem.type === MENU_ITEM_TYPES.CONTAINER) {
      // To check for duplicate item/size combinations
      const seen = new Set<string>();
      // To validate total container size against variableMaxAmount
      let sum = 0;
      // To aggregate created items, updated items, and currently existing items not being updated
      const itemMap = new Map<string | number, string>();

      // Get the MenuItemContainerItems contained Items and their sizes to validate create DTOs
      // Get current containerItems to validate for duplicates and total container size
      const currentEntity = await this.repo.findOne({
        where: { id },
        relations: [
          'containerItems.containedItem', // OrderContainer Item
          'containerItems.containedItemSize', // OrderContainer Item
          'menuItem.containerItems.containedItem', // MenuItemContainerItem
          'menuItem.containerItems.containedItemSize', // MenuItemContainerItem
        ],
      });
      if (
        !currentEntity ||
        currentEntity.menuItem.containerMenuItems.length === 0
      ) {
        throw new Error();
      }
      if (dto.containerOrderMenuDtos?.length) {
        // check valid items for container
        for (const nestedDto of dto.containerOrderMenuDtos) {
          if (nestedDto.createDto) {
            const createDto = nestedDto.createDto;
            if (!createDto) {
              throw new Error();
            }
            if (!nestedDto.createId) {
              throw new Error();
            }

            itemMap.set(
              nestedDto.createId,
              `${createDto.containedMenuItemId}:${createDto.containedItemSizeId}`,
            );

            // Validate variable max quantity, accounting for entities being created
            sum += createDto.quantity;

            const isValid = currentEntity.menuItem.containerMenuItems.find(
              (x) =>
                x.containedMenuItem.id === createDto.containedMenuItemId &&
                x.containedItemSize.id === createDto.containedItemSizeId,
            );
            if (!isValid) {
              const err = new ValidationErrorNode(
                'containerItems',
                id,
                'invalid item for container',
              );
              results.push(err);
            }
          } else if (nestedDto.updateDto) {
            if (
              nestedDto.updateDto.containedMenuItemId ||
              nestedDto.updateDto.containedItemSizeId
            ) {
              const updateDto = nestedDto.updateDto;
              if (!updateDto) {
                throw new Error();
              }
              if (!nestedDto.id) {
                throw new Error();
              }
              const currentContainerItem =
                await this.orderContainerItemRepo.findOne({
                  where: { id: nestedDto.id },
                  relations: ['containedItem', 'containedItemSize'],
                });
              if (!currentContainerItem) {
                throw new Error();
              }

              const itemId =
                updateDto.containedMenuItemId ??
                currentContainerItem.containedMenuItem.id;
              const sizeId =
                updateDto.containedItemSizeId ??
                currentContainerItem.containedItemSize.id;

              itemMap.set(nestedDto.id, `${itemId}:${sizeId}`);

              // Validate variable max quantity, accounting for entities being updated
              if (updateDto.quantity) {
                sum += updateDto.quantity;
              } else {
                sum += currentContainerItem.quantity;
              }

              const isValid = currentEntity.menuItem.containerMenuItems.find(
                (x) =>
                  x.containedMenuItem.id === itemId &&
                  x.containedItemSize.id === sizeId,
              );
              if (!isValid) {
                const err = new ValidationErrorNode(
                  'containerItems',
                  id,
                  'invalid item for container',
                );
                results.push(err);
              }
            }
          }
        }
        // check no duplicate containedItem/ containedSize combinations
        for (const currentItem of currentEntity.containerOrderMenuItems) {
          const alreadyPresent = itemMap.get(currentItem.id);

          if (!alreadyPresent) {
            itemMap.set(
              currentItem.id,
              `${currentItem.containedMenuItem.id}:${currentItem.containedItemSize.id}`,
            );
            // Validate variable max quantity, accounting for entities not being updated
            sum += currentItem.quantity;
          }
        }
        for (const val of itemMap.values()) {
          if (seen.has(val)) {
            const err = new ValidationErrorNode(
              'containerItems',
              id,
              'duplicate item in container',
            );
            results.push(err);
          } else {
            seen.add(val);
          }
        }

        // validate container quantity based on variableMax
        if (currentEntity.menuItem.variableMaxAmount) {
          if (sum !== currentEntity.menuItem.variableMaxAmount) {
            const err = new ValidationErrorNode(
              'containerItems',
              id,
              'contained items do not total to defined container size',
            );
          }
        }

        // nested validator call
        const nestedDtoErrs =
          await this.orderContainerItemValidator.validateManyNestedNode(
            'orderedContainerItems',
            dto.containerOrderMenuDtos,
          );
        if (nestedDtoErrs) {
          results.push(nestedDtoErrs);
        }
      }
    }
    return this.checkValidateResult(results);
  }
}
