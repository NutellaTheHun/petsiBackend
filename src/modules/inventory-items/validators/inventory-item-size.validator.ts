import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import {
  InventoryItemSize,
  InventoryItemSizeEntity,
} from '../entities/inventory-item-size.entity';

@Injectable()
export class InventoryItemSizeValidator extends ValidatorBase<InventoryItemSizeEntity> {
  constructor(
    @InjectRepository(InventoryItemSize)
    private readonly repo: Repository<InventoryItemSize>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItemSize', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryItemSizeDto,
    id?: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // measureAmount
    this.helper.enforcePositive(
      dto.measureAmount,
      'measureAmount',
      errorMap,
      'cannot be less than or equal to 0',
    );

    // cost
    this.helper.enforcePositive(
      dto.cost,
      'cost',
      errorMap,
      'cannot be less than or equal to 0',
    );

    // check for current package / unit of measure / cost already exists?
    const exists = await this.repo.findOne({
      where: {
        measureType: { id: dto.measureTypeId },
        package: {
          id: dto.packageId,
        },
        inventoryItem: { id: dto.inventoryItemId },
      },
    });
    if (exists) {
      // Most relevant conflict signal for FE is the measure type selection.
      errorMap.addChild(
        'measureType',
        new ValidationErrorMap(undefined, 'Inventory item size already exists'),
      );
    }

    return errorMap;
  }

  protected async doValidateNestedCreateNode(
    dto: NestedCreateInventoryItemSizeDto,
    id: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // measureAmount
    this.helper.enforcePositive(
      dto.measureAmount,
      'measureAmount',
      errorMap,
      'cannot be less than or equal to 0',
    );

    // cost
    this.helper.enforcePositive(
      dto.cost,
      'cost',
      errorMap,
      'cannot be less than or equal to 0',
    );

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemSizeDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // measureAmount cannot be less than or equal to 0
    if (dto.measureAmount) {
      this.helper.enforcePositive(
        dto.measureAmount,
        'measureAmount',
        errorMap,
        'cannot be less than or equal to 0',
      );
    }

    // cost cannot be less than or equal to 0
    if (dto.cost) {
      this.helper.enforcePositive(
        dto.cost,
        'cost',
        errorMap,
        'cannot be less than or equal to 0',
      );
    }

    // Cant update a item size to a already existing combination of packageType and measure unit size.
    if (dto.measureTypeId || dto.packageId) {
      const currentSize = await this.repo.findOne({
        where: { id },
        relations: ['inventoryItem', 'measureType', 'package'],
      });
      if (!currentSize) {
        throw new NotFoundException();
      }
      const exists = await this.repo.findOne({
        where: {
          measureType: { id: dto.measureTypeId ?? currentSize.measureType.id },
          package: {
            id: dto.packageId ?? currentSize.package.id,
          },
          inventoryItem: { id: currentSize.inventoryItem.id },
        },
      });
      if (exists) {
        const prop = dto.measureTypeId ? 'measureType' : 'package';
        errorMap.addChild(
          prop,
          new ValidationErrorMap(
            undefined,
            'Inventory item size already exists',
          ),
        );
      }
    }

    return errorMap;
  }

  protected async doValidateNestedUpdateNode(
    dto: NestedUpdateInventoryItemSizeDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    // Currently no difference in validation between nested update and root update
    return await this.doValidateUpdateNode(
      dto as unknown as UpdateInventoryItemSizeDto,
      id,
    );
  }
}
