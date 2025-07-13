import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemContainerOptions } from '../../menu-items/entities/menu-item-container-options.entity';
import { MenuItemContainerRule } from '../../menu-items/entities/menu-item-container-rule.entity';
import { MenuItemContainerOptionsService } from '../../menu-items/services/menu-item-container-options.service';
import { MenuItemSizeService } from '../../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderContainerItemService } from '../services/order-container-item.service';

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItem> {
  constructor(
    @InjectRepository(OrderContainerItem)
    repo: Repository<OrderContainerItem>,

    @Inject(forwardRef(() => OrderContainerItemService))
    private readonly containerItemService: OrderContainerItemService,

    @Inject(forwardRef(() => MenuItemSizeService))
    private readonly sizeService: MenuItemSizeService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly itemService: MenuItemService,

    private readonly optionsService: MenuItemContainerOptionsService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'OrderContainerItem', requestContextService, logger);
  }

  public async validateCreate(dto: CreateOrderContainerItemDto): Promise<void> {
    // validate item / size
    const containedItem = await this.itemService.findOne(
      dto.containedMenuItemId,
      ['validSizes'],
    );
    if (!containedItem) {
      throw new Error();
    }
    if (
      !this.helper.isValidSize(
        dto.containedMenuItemSizeId,
        containedItem.validSizes,
      )
    ) {
      this.addError({
        errorMessage: 'Invalid size for contained item.',
        errorType: 'INVALID',
        contextEntity: 'CreateOrderContainerItemDto',
        sourceEntity: 'MenuItemSize',
        sourceId: dto.containedMenuItemSizeId,
        conflictEntity: 'MenuItem',
        conflictId: containedItem.id,
      } as ValidationError);
    }

    // validate rule item / size
    const options = await this.getContainerOptions(
      dto.parentContainerMenuItemId,
    );
    if (options) {
      const rule = this.GetItemRule(
        dto.containedMenuItemId,
        options.containerRules,
      );
      // validate item
      if (rule) {
        // validate size
        if (
          !this.helper.isValidSize(dto.containedMenuItemSizeId, rule.validSizes)
        ) {
          this.addError({
            errorMessage: 'Invalid item size for container.',
            errorType: 'INVALID',
            contextEntity: 'CreateOrderContainerItemDto',
            sourceEntity: 'MenuItemSize',
            sourceId: dto.containedMenuItemSizeId,
            conflictEntity: 'MenuItemContainerRule',
            conflictId: rule.id,
          } as ValidationError);
        }
      } else {
        this.addError({
          errorMessage: 'Invalid item for container.',
          errorType: 'INVALID',
          contextEntity: 'CreateOrderContainerItemDto',
          sourceEntity: 'MenuItem',
          sourceId: dto.containedMenuItemId,
          conflictEntity: 'MenuItem',
          conflictId: dto.parentContainerMenuItemId,
        } as ValidationError);
      }
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateOrderContainerItemDto,
  ): Promise<void> {
    // requires ParentContainer id to validate contained item or size
    if (
      (dto.containedMenuItemId || dto.containedMenuItemSizeId) &&
      !dto.parentContainerMenuItemId
    ) {
      this.addError({
        errorMessage: 'Missing parent container item id.',
        errorType: 'INVALID',
        contextEntity: 'UpdateOrderContainerItemDto',
        contextId: id,
        sourceEntity: 'MenuItem',
      } as ValidationError);
    }

    if (
      (dto.containedMenuItemId || dto.containedMenuItemSizeId) &&
      dto.parentContainerMenuItemId
    ) {
      const containerItem = await this.containerItemService.findOne(id, [
        'containedItem',
        'containedItemSize',
      ]);

      const itemId = dto.containedMenuItemId ?? containerItem.containedItem.id;
      const sizeId =
        dto.containedMenuItemSizeId ?? containerItem.containedItemSize.id;

      const containedSize = await this.sizeService.findOne(sizeId);
      if (!containedSize) {
        throw new Error();
      }

      const containedItem = await this.itemService.findOne(itemId, [
        'validSizes',
      ]);
      if (!containedItem) {
        throw new Error();
      }

      // validate item / size
      if (!this.helper.isValidSize(sizeId, containedItem.validSizes)) {
        this.addError({
          errorMessage: 'Invalid size for item.',
          errorType: 'INVALID',
          contextEntity: 'UpdateOrderContainerItemDto',
          contextId: id,
          sourceEntity: 'MenuItemSize',
          sourceId: sizeId,
          conflictEntity: 'MenuItem',
          conflictId: containedItem.id,
        } as ValidationError);
      }

      // If dynamic container
      const options = await this.getContainerOptions(
        dto.parentContainerMenuItemId,
      );
      if (options) {
        const rule = this.GetItemRule(itemId, options.containerRules);

        // validate rule / item
        // (implied dto.containedMenuItemId for rule to be null)
        if (!rule) {
          this.addError({
            errorMessage: 'Invalid item for container.',
            errorType: 'INVALID',
            contextEntity: 'UpdateOrderContainerItemDto',
            contextId: id,
            sourceEntity: 'MenuItem',
            sourceId: dto.containedMenuItemId,
            conflictEntity: 'MenuItem',
            conflictId: dto.parentContainerMenuItemId,
          } as ValidationError);
        } else {
          // validate rule / size
          if (dto.containedMenuItemSizeId) {
            if (
              !this.helper.isValidSize(
                dto.containedMenuItemSizeId,
                rule.validSizes,
              )
            ) {
              this.addError({
                errorMessage: 'Invalid size for container.',
                errorType: 'INVALID',
                contextEntity: 'UpdateOrderContainerItemDto',
                contextId: id,
                sourceEntity: 'MenuItemSize',
                sourceId: dto.containedMenuItemSizeId,
                conflictEntity: 'MenuItem',
                conflictId: dto.parentContainerMenuItemId,
              } as ValidationError);
            }
          }
        }
      }
    }

    this.throwIfErrors();
  }

  private async getContainerOptions(
    parentContainerMenuItemId: number,
  ): Promise<MenuItemContainerOptions | null> {
    const parentContainer = await this.itemService.findOne(
      parentContainerMenuItemId,
      ['containerOptions'],
    );
    if (!parentContainer.containerOptions) {
      return null;
    }

    return await this.optionsService.findOne(
      parentContainer.containerOptions.id,
      ['containerRules'],
    );
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
    const rule = rules.find((rule) => rule.validItem.id === itemToValidateId);
    if (!rule) {
      return null;
    }
    return rule;
  }
}
