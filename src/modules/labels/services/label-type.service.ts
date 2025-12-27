import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { LabelTypeBuilder } from '../builders/label-type.builder';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType, LabelTypeEntity } from '../entities/label-type.entity';
import { LabelTypeValidator } from '../validators/label-type.validator';

@Injectable()
export class LabelTypeService extends ServiceBase<LabelTypeEntity> {
  constructor(
    @InjectRepository(LabelType)
    private readonly repo: Repository<LabelType>,

    builder: LabelTypeBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: LabelTypeValidator,
  ) {
    super(
      repo,
      builder,
      'LabelTypeService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateLabelTypeDto,
    manager: EntityManager,
  ): Promise<LabelType> {
    const result = manager.create(LabelType, {
      labelTypeLength: dto.length,
      labelTypeWidth: dto.width,
      labelTypeName: dto.name,
    });
    return result;
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
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof LabelType>,
  ): Promise<LabelType | null> {
    return await this.repo.findOne({
      where: { name: name },
      relations,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<LabelType>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'labelTypeName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
