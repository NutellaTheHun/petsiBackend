import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCount> {
  constructor(
    @InjectRepository(InventoryAreaCount)
    private readonly _repo: Repository<InventoryAreaCount>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(_repo, 'InventoryAreaCount', requestContextService, logger);
  }

  public validateCreateNode(
    field: string,
    dto?: any,
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null> {
    return Promise.resolve(null);
  }

  public validateUpdateNode(
    field: string,
    dto?: any,
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode('root');

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
            'countedItems',
            dupId,
            'duplicate update requests for counted inventory item.',
          ),
        );
      }
    }
    return Promise.resolve(null);
  }
}
