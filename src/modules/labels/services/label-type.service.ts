import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType, LabelTypeEntity } from '../entities/label-type.entity';
import { LabelTypeChangeDetector } from '../utils/change-detectors/label-type.change-detector';
import { LabelTypeValidator } from '../validators/label-type.validator';

@Injectable()
export class LabelTypeService extends ServiceBase<LabelTypeEntity> {
  constructor(
    @InjectRepository(LabelType)
    repo: Repository<LabelType>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: LabelTypeValidator,
    private readonly labelTypeChangeDetector: LabelTypeChangeDetector,
  ) {
    super(repo, 'LabelTypeService', requestContextService, logger, validator);
  }

  protected async createEntity(
    dto: CreateLabelTypeDto,
    manager: EntityManager,
  ): Promise<LabelType> {
    const result = manager.create(LabelType, {
      length: dto.length,
      width: dto.width,
      name: dto.name,
    });
    return await manager.save(result);
  }
  protected async updateEntity(
    dto: UpdateLabelTypeDto,
    manager: EntityManager,
    entity: LabelType,
  ): Promise<void> {
    if (dto.length !== undefined) {
      entity.length = dto.length;
    }
    if (dto.width !== undefined) {
      entity.width = dto.width;
    }
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    await manager.save(entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<LabelType>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }

  protected getChangeDetector(): ChangeDetectorBase<LabelType, UpdateLabelTypeDto> | undefined {
    return this.labelTypeChangeDetector;
  }
}
