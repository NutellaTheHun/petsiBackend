import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryAreaCount, InventoryAreaCountEntity } from '../entities/inventory-area-count.entity';
import { InventoryAreaItemValidator } from './inventory-area-item.validator';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCountEntity> {
  constructor(
    @InjectRepository(InventoryAreaCount)
    private readonly _repo: Repository<InventoryAreaCount>,
    logger: AppLogger,
    requestContextService: RequestContextService,

    private readonly areaItemValidator: InventoryAreaItemValidator,
  ) {
    super(_repo, 'InventoryAreaCount', requestContextService, logger);
  }

  public async doValidateCreateNode(
    result: ValidationErrorNode,
    dto: CreateInventoryAreaCountDto,
    id?: string | number,
    message?: string,
  ): Promise<void> {}

  public async doValidateUpdateNode(
    result: ValidationErrorNode,
    dto: any,
    id?: string | number,
    message?: string,
  ): Promise<void> {
    if (dto.itemCountDtos && dto.itemCountDtos.length > 0) {
      const ids: number[] = [];
      for (const d of dto.itemCountDtos) {
        if (d.updateDto && d.id) {
          ids.push(d.id);
        }
      }
      const duplicateIds = this.helper.findDuplicates(ids, (id) => `${id}`);
      if (duplicateIds.length > 0) {
        duplicateIds.map((dupId) =>
          result.addChild(
            new ValidationErrorNode(
              'countedItems',
              dupId,
              'duplicate update requests for counted inventory item.',
            ),
          ),
        );
      }
    }
    if (dto) {
      // handle nested -> create | update validation
      // list of areaItem Dtos
      const child = await this.areaItemValidator.validateNestedNode(
        'countedItems',
        ,
      );
      if (child) {
        result.addChild(child);
      }
    }
  }
}
