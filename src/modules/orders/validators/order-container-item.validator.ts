import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemContainerOptions } from '../../menu-items/entities/menu-item-container-options.entity';
import { MenuItemContainerRule } from '../../menu-items/entities/menu-item-container-rule.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/menu-items.module';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import {
  OrderContainerItem,
  OrderContainerItemEntity,
} from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItemEntity> {
  constructor(
    @InjectRepository(OrderContainerItem)
    private readonly repo: Repository<OrderContainerItem>,

    @InjectRepository(MenuItemSize)
    private readonly menuItemSizeRepo: Repository<MenuItemSize>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    @InjectRepository(OrderMenuItem)
    private readonly orderMenuItemRepo: Repository<OrderMenuItem>,

    @InjectRepository(MenuItemContainerItem)
    private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'OrderContainerItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateOrderContainerItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // validate contained item
    const containedItem = await this.menuItemRepo.findOne({
      where: { id: dto.containedMenuItemId },
      relations: ['validSizes'],
    });
    if (!containedItem) {
      throw new NotFoundException();
    }

    // contained item type single
    if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
      const err = new ValidationErrorNode(
        'type',
        id,
        'Only items of type single can be in a container',
      );
      results.push(err);
    }

    // contained item size
    if (
      !this.helper.isValidSize(
        dto.containedMenuItemSizeId,
        containedItem.validSizes,
      )
    ) {
      const err = new ValidationErrorNode(
        'containedItemSize',
        id,
        'Invalid size for contained item.',
      );
      results.push(err);
    }

    // validate parent / container item
    const parentOrderMenuItem = await this.orderMenuItemRepo.findOne({
      where: { id: dto.parentOrderMenuItemId },
      relations: [
        'menuItem',
        'size',
        'menuItem.variableRules',
        'menuItem.fixedContents',
        'menuItem.fixedContents.containedItem',
      ],
    });
    if (!parentOrderMenuItem) {
      throw new Error(
        `OrderContainerItem validator: menu item with id ${dto.parentContainerMenuItemId} was not found`,
      );
    }

    const parentItem = parentOrderMenuItem.menuItem;

    if (parentItem.type === MENU_ITEM_TYPES.VARIABLE_CONTAINER) {
      const rule = this.GetItemRule(
        dto.containedMenuItemId,
        parentItem.variableRules,
      );
      if (rule) {
        if (
          !this.helper.isValidSize(dto.containedMenuItemSizeId, rule.validSizes)
        ) {
          const err = new ValidationErrorNode(
            'containedItemSize',
            undefined,
            'Invalid item size for container.',
          );
          results.push(err);
        }
      } else {
        const err = new ValidationErrorNode(
          'containedItem',
          id,
          'Invalid item for container.',
        );
        results.push(err);
      }
    } else if (parentItem.type === MENU_ITEM_TYPES.FIXED_CONTAINER) {
      const isValid = await this.menuItemContainerItemRepo.findOne({
        where: {
          parent: { id: parentItem.id },
          parentItemSize: { id: parentOrderMenuItem.size.id },
          containedItem: { id: dto.containedMenuItemId },
          containedItemSize: { id: dto.containedMenuItemSizeId },
        },
      });
      if (!isValid) {
        const err = new ValidationErrorNode(
          'containedItem',
          id,
          'Invalid item for container.',
        );
        results.push(err);
      }
    } else {
      const err = new ValidationErrorNode(
        'type',
        id,
        'parent item must be of type variable or fixed container',
      );
      results.push(err);
    }

    if (dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity must be greater than 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateOrderContainerItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];
    let containedItem: MenuItem | null = null;

    if (dto.containedMenuItemId) {
      containedItem = await this.menuItemRepo.findOne({
        where: { id: dto.containedMenuItemId },
        relations: ['validSizes'],
      });
      if (!containedItem) {
        throw new Error(
          `OrderContainerItem validator: contained menu item with id ${dto.containedMenuItemId}`,
        );
      }

      if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
        const err = new ValidationErrorNode(
          'containedItem',
          id,
          'contained item must be of type single.',
        );
        results.push(err);
      }
    }

    if (dto.containedMenuItemSizeId) {
      if (!containedItem) {
        containedItem = await this.menuItemRepo.findOne({
          where: { id: dto.containedMenuItemId },
          relations: ['validSizes'],
        });
        if (!containedItem) {
          throw new Error(
            `OrderContainerItem validator: contained menu item with id ${dto.containedMenuItemId}`,
          );
        }
      }

      if (
        !this.helper.isValidSize(
          dto.containedMenuItemSizeId,
          containedItem.validSizes,
        )
      ) {
        const err = new ValidationErrorNode(
          'containedItemSize',
          id,
          'Invalid size for contained item.',
        );
        results.push(err);
      }
    }

    if (dto.containedMenuItemId || dto.containedMenuItemSizeId) {
      const toUpdate = await this.repo.findOne({
        where: { id },
        relations: [
          'parentOrderItem',
          'parentOrderItem.menuItem',
          'parentOrderItem.size',
          'parentOrderItem.menuItem.variableRules',
          'parentOrderItem.menuItem.fixedContents',
        ],
      });
      if (!toUpdate) {
        throw new Error(
          `OrderContainerItem validation: order container item being updated not found.`,
        );
      }

      const parentContainerItem = toUpdate.parentOrderItem.menuItem;
      if (parentContainerItem.variableRules.length) {
      } else if (parentContainerItem.fixedContents.length) {
      }
    }

    if (dto.quantity && dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity must be greater than 0',
      );
      results.push(err);
    }

    // requires ParentContainer id to validate contained item or size
    if (
      (dto.containedMenuItemId || dto.containedMenuItemSizeId) &&
      !dto.parentContainerMenuItemId
    ) {
      const err = new ValidationErrorNode(
        'parentOrderItem',
        id,
        'Missing parent container item id.',
      );
      results.push(err);
    }

    if (
      id &&
      (dto.containedMenuItemId || dto.containedMenuItemSizeId) &&
      dto.parentContainerMenuItemId
    ) {
      /*const containerItem = await this.containerItemService.findOne(id, [
        'containedItem',
        'containedItemSize',
      ]);*/
      const containerItem = await this.repo.findOne({
        where: { id },
        relations: ['containedItem', 'containedItemSize'],
      });
      if (!containerItem) {
        throw new NotFoundException();
      }
      const itemId = dto.containedMenuItemId ?? containerItem.containedItem.id;
      const sizeId =
        dto.containedMenuItemSizeId ?? containerItem.containedItemSize.id;

      //const containedSize = await this.sizeService.findOne(sizeId);
      const containedSize = await this.menuItemSizeRepo.findOne({
        where: { id: sizeId },
      });
      if (!containedSize) {
        throw new NotFoundException();
      }

      /*const containedItem = await this.itemService.findOne(itemId, [
        'validSizes',
      ]);*/
      const containedItem = await this.menuItemRepo.findOne({
        where: { id: itemId },
        relations: ['validSizes'],
      });
      if (!containedItem) {
        throw new NotFoundException();
      }

      // validate item / size
      if (!this.helper.isValidSize(sizeId, containedItem.validSizes)) {
        const err = new ValidationErrorNode(
          'containedItemSize',
          id,
          'Invalid size for item.',
        );
        results.push(err);
      }

      // If dynamic container
      /*const options = await this.getContainerOptions(
        dto.parentContainerMenuItemId,
      );*/
      const parentItem = await this.menuItemRepo.findOne({
        where: { id: dto.parentContainerMenuItemId },
        relations: ['variableRules'],
      });
      if (parentItem && parentItem.variableRules) {
        const rule = this.GetItemRule(itemId, parentItem.variableRules);

        // validate rule / item
        // (implied dto.containedMenuItemId for rule to be null)
        if (!rule) {
          const err = new ValidationErrorNode(
            'containedItem',
            undefined,
            'Invalid item for container.',
          );
          results.push(err);
        } else {
          // validate rule / size
          if (dto.containedMenuItemSizeId) {
            if (
              !this.helper.isValidSize(
                dto.containedMenuItemSizeId,
                rule.validSizes,
              )
            ) {
              const err = new ValidationErrorNode(
                'containedItemSize',
                id,
                'Invalid size for container.',
              );
              results.push(err);
            }
          }
        }
      }
    }

    return this.checkValidateResult(results);
  }

  /**
   * Searches an array of {@link MenuItemContainerRule} for the given {@link MenuItem} and returns it
   * or null if not found.
   *
   * @param itemToValidateId The id of the current {@link OrderContainerItem.containedItem}
   * or id of the incoming DTO's containedMenuItemId property.
   *
   * @param rules The set of {@link MenuItemContainerRule} of the parent container (is within the parent's {@link MenuItemContainerOptions})
   *
   * @returns
   * The {@link MenuItemContainerRule} where the validItem matches the {@link itemToValidateId}, or null if not found.
   */
  private GetItemRule(
    itemToValidateId: number,
    rules: MenuItemContainerRule[],
  ): MenuItemContainerRule | null {
    return rules.find((rule) => rule.validItem.id === itemToValidateId) ?? null;
  }

  private getFixedItem(
    itemToValidateId: number,
    fixedContents: MenuItemContainerItem[],
  ): MenuItemContainerItem | null {
    return (
      fixedContents.find(
        (item) => item.containedItem.id === itemToValidateId,
      ) ?? null
    );
  }
}
