import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
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
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // measureAmount
    this.helper.enforcePositive(
      dto.measureAmount,
      'measureAmount',
      results,
      'cannot be less than or equal to 0',
      id,
    );

    // cost
    this.helper.enforcePositive(
      dto.cost,
      'cost',
      results,
      'cannot be less than or equal to 0',
      id,
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
      // to specific, not a 'prop' problem but a collection, the parent entity is more the problem
      const err = new ValidationErrorNode(
        'measureUnit', // but must reference a prop? make it a array, make FE process multi prop errors
        id,
        'Inventory item size already exists',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemSizeDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // measureAmount cannot be less than or equal to 0
    if (dto.measureAmount) {
      this.helper.enforcePositive(
        dto.measureAmount,
        'measureAmount',
        results,
        'cannot be less than or equal to 0',
        id,
      );
    }

    // cost cannot be less than or equal to 0
    if (dto.cost) {
      this.helper.enforcePositive(
        dto.cost,
        'cost',
        results,
        'cannot be less than or equal to 0',
        id,
      );
    }

    // Cant update a item size to a already existing combination of packageType and measure unit size.
    if (dto.measureTypeId || dto.packageId) {
      const currentSize = await this.repo.findOne({
        where: { id },
        relations: ['inventoryItem', 'measureUnit', 'packageType'],
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
        const prop = dto.measureTypeId ? 'measureUnit' : 'packageType';
        const err = new ValidationErrorNode(
          prop,
          id,
          'Inventory item size already exists',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
