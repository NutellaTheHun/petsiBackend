import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItemEntity> {
  constructor(
    @InjectRepository(MenuItem)
    private readonly repo: Repository<MenuItem>,

    private readonly menuItemContainerValidator: MenuItemContainerItemValidator,

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

    // name must be unique
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Menu item already exists.',
      id,
    );

    if (dto.containerMenuItems?.length) {
      if (dto.type !== MENU_ITEM_TYPES.CONTAINER) {
        const err = new ValidationErrorNode(
          'type',
          id,
          'item has contained items but is not set to type container',
        );
        results.push(err);
      }

      // if variableMaxAmount, validate each container item quantity totals to variableMaxAmount
      if (dto.variableMaxAmount) {
        let sum = 0;
        for (const containerItem of dto.containerMenuItems) {
          sum += containerItem.quantity;
        }
        if (sum !== dto.variableMaxAmount) {
          const err = new ValidationErrorNode(
            'containerMenuItems',
            id,
            'container items do not total to variable max amount',
          );
          results.push(err);
        }
      }

      // nested validator call
      const nestedDtoErr =
        await this.menuItemContainerValidator.validateManyNestedNode(
          'containerMenuItems',
          dto.containerMenuItems,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // exists
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Menu item already exists.',
        id,
      );
    }

    // containerItem dtos
    if (dto.containerMenuItems?.length) {
      if (dto.type !== MENU_ITEM_TYPES.CONTAINER) {
        const err = new ValidationErrorNode(
          'type',
          id,
          'item has contained items but is not set to type container',
        );
        results.push(err);
      }

      // if variableMaxAmount, validate each container item quantity totals to variableMaxAmount
      if (dto.variableMaxAmount) {
        // get current container items
        const currentContainerItems = await this.repo.findOne({
          where: { id },
          relations: ['containerMenuItems'],
        });
        if (!currentContainerItems) {
          throw new Error();
        }

        // Combine current container items with new container items
        const itemMap = new Map<string | number, number>();

        // Add current container items to itemMap
        for (const containerItem of currentContainerItems.containerMenuItems) {
          itemMap.set(containerItem.id, containerItem.quantity);
        }

        // Add new container items to itemMap, updating or creating as needed
        for (const nestedDto of dto.containerMenuItems) {
          if ('createId' in nestedDto) {
            itemMap.set(nestedDto.createId, nestedDto.quantity);
          } else if ('id' in dto) {
            if (nestedDto.quantity) {
              itemMap.set(nestedDto.id, nestedDto.quantity);
            }
          }
        }

        // Validate that the total quantity of container items equals the variableMaxAmount
        let sum = 0;
        for (const quantity of itemMap.values()) {
          sum += quantity;
        }
        if (sum !== dto.variableMaxAmount) {
          const err = new ValidationErrorNode(
            'containerMenuItems',
            id,
            'container items do not total to variable max amount',
          );
          results.push(err);
        }
      }

      // nested validator call
      const nestedDtoErr =
        await this.menuItemContainerValidator.validateManyNestedNode(
          'containerMenuItems',
          dto.containerMenuItems,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    return this.checkValidateResult(results);
  }
}
