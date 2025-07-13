import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
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

  public async validateCreate(dto: CreateInventoryAreaCountDto): Promise<void> {
    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateInventoryAreaCountDto,
  ): Promise<void> {
    // no duplicate update dtos (same id)
    if (dto.itemCountDtos && dto.itemCountDtos.length > 0) {
      const ids: number[] = [];
      for (const d of dto.itemCountDtos) {
        if (d.update) {
          ids.push(d.update.id);
        }
      }
      const duplicateIds = this.helper.findDuplicates(ids, (id) => `${id}`);
      if (duplicateIds.length > 0) {
        duplicateIds.map((id) =>
          this.addError(
            new ValidationError({
              errorMessage:
                'duplicate update requests for counted inventory item.',
              errorType: 'DUPLICATE',
              contextEntity: 'UpdateInventoryAreaCountDto',
              contextId: id,
              sourceEntity: 'UpdateChildInventoryAreaItemDto',
              sourceId: id,
            }),
          ),
        );
      }
    }

    this.throwIfErrors();
  }
}
