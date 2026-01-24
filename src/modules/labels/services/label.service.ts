import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label, LabelEntity } from '../entities/label.entity';
import { LabelValidator } from '../validators/label.validator';

@Injectable()
export class LabelService extends ServiceBase<LabelEntity> {
  constructor(
    @InjectRepository(Label)
    private readonly repo: Repository<Label>,

    //builder: LabelBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: LabelValidator,
  ) {
    super(
      repo,
      //builder,
      'LabelService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateLabelDto,
    manager: EntityManager,
  ): Promise<Label> {
    const result = manager.create(Label, {
      menuItem: { id: dto.menuItemId },
      imageUrl: dto.imageUrl,
      labelType: { id: dto.labelTypeId },
    });
    return await manager.save(result);
  }

  protected async updateEntity(
    dto: UpdateLabelDto,
    manager: EntityManager,
    entity: Label,
  ): Promise<void> {
    if (dto.imageUrl !== undefined) {
      entity.imageUrl = dto.imageUrl;
    }

    if (dto.labelTypeId !== undefined) {
      entity.labelType = manager.create(LabelType, {
        id: dto.labelTypeId,
      });
    }

    if (dto.menuItemId !== undefined) {
      entity.menuItem = manager.create(MenuItem, {
        id: dto.menuItemId,
      });
    }

    await manager.save(entity);
  }

  /*async findByMenuItemId(
    itemId: number,
    relations?: Array<keyof Label>,
  ): Promise<Label[]> {
    return await this.repo.find({
      where: {
        menuItem: { id: itemId },
      },
      relations,
    });
  }*/

  protected applySearch(
    query: SelectQueryBuilder<Label>,
    search: string,
  ): void {
    query.andWhere('(LOWER(menuItem.name) LIKE :search)', {
      search: `%${search.toLowerCase()}%`,
    });
  }

  protected applyFilters(
    query: SelectQueryBuilder<Label>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.labelType && filters.labelType.length > 0) {
      query.andWhere('entity.labelType IN (:...labelTypes)', {
        labelTypes: filters.labelType,
      });
    }
  }

  protected applySortBy(
    query: SelectQueryBuilder<Label>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'labelType') {
      query.leftJoinAndSelect('entity.labelType', 'labelType');
      query.orderBy(`labelType.labelTypeName`, sortOrder);
    }
  }
}
